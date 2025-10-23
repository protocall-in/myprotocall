
import { useEffect, useState } from 'react';
import { PledgeSession, Pledge, PledgeExecutionRecord } from '@/api/entities';
import { toast } from 'sonner';

// Helper for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function AutomatedExecutionEngine({ enabled, user, onExecutionComplete }) {
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!enabled || !user) {
      // console.log("AE Engine disabled or user not available.");
      return;
    }

    const checkAndExecuteSessions = async () => {
      if (isExecuting) {
        // console.log("AE Engine is already executing, skipping this cycle.");
        return;
      }

      try {
        setIsExecuting(true);
        // console.log('⚙️ Automated Execution Engine: Checking for sessions to execute...');
        
        // This logic replaces the old 'active' -> 'closed' -> 'executing' flow.
        // It directly looks for active sessions that are past their end time and have 'session_end' execution rule.
        const sessions = await PledgeSession.filter({ 
          status: 'active',
          execution_rule: 'session_end'
        }).catch(err => {
            console.error("AE Engine: Failed to fetch active sessions for execution", err);
            return [];
        });

        const now = new Date();

        for (const session of sessions) {
          const sessionEnd = new Date(session.session_end);
          
          if (sessionEnd <= now) {
            console.log(`🤖 Auto-executing session: ${session.id} (${session.stock_symbol})`);
            
            // Immediately transition session status to 'executing'
            await PledgeSession.update(session.id, { status: 'executing' });
            
            try {
              await executeSession(session, user);
              if (onExecutionComplete) {
                onExecutionComplete(session.id, 'success');
              }
            } catch (execError) {
              console.error(`❌ Error during execution of session ${session.id}:`, execError);
              if (onExecutionComplete) {
                onExecutionComplete(session.id, 'failed', execError.message);
              }
              // Mark session as failed or completed even on pledge execution errors
              await PledgeSession.update(session.id, {
                status: 'completed', // Or 'failed', depending on desired behavior for partially failed sessions
                last_executed_at: new Date().toISOString(),
                admin_notes: `Execution failed: ${execError.message}`
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in automated execution engine (top-level check):', error);
        toast.error('Automated execution engine encountered an error.'); // Keep toast for top-level errors
      } finally {
        setIsExecuting(false);
      }
    };

    const interval = setInterval(checkAndExecuteSessions, 60000); // Check every 60 seconds
    checkAndExecuteSessions(); // Run immediately on mount/enable

    return () => clearInterval(interval);
  }, [enabled, user, onExecutionComplete, isExecuting]);

  const executeSession = async (session, executingUser) => {
    if (!executingUser) {
      console.error('❌ Error during session execution: - user is undefined');
      throw new Error('User is required for execution');
    }
    
    console.log(`🚀 Starting execution for session ${session.id} with user ${executingUser.id}`);

    try {
      // Find pledges ready for execution in this session that are 'paid'
      const pledges = await Pledge.filter({ 
        session_id: session.id,
        status: 'paid'
      }).catch(err => {
        console.error(`AE Engine: Failed to fetch paid pledges for session ${session.id}`, err);
        return [];
      });

      if (pledges.length === 0) {
        console.log(`✅ No 'paid' pledges found for session ${session.id}. Completing session.`);
        await PledgeSession.update(session.id, {
          status: 'completed',
          last_executed_at: new Date().toISOString()
        });
        return;
      }

      console.log(`🔥 Found ${pledges.length} 'paid' pledges to execute for session ${session.id}.`);

      for (const pledge of pledges) {
        try {
          if (!executingUser || !executingUser.id) {
            console.error(`❌ Failed to execute ${pledge.side?.toUpperCase()} for pledge ${pledge.id}: - user is undefined`);
            await Pledge.update(pledge.id, { status: 'failed', admin_notes: 'Execution failed: No executing user context' });
            continue;
          }

          // Simulate network latency or processing time
          await delay(200); 

          const executionRecord = await PledgeExecutionRecord.create({
            pledge_id: pledge.id,
            session_id: session.id,
            user_id: pledge.user_id,
            demat_account_id: pledge.demat_account_id,
            stock_symbol: pledge.stock_symbol,
            side: pledge.side,
            pledged_qty: pledge.qty,
            executed_qty: pledge.qty,
            executed_price: pledge.price_target, // Using price_target directly as executed price
            total_execution_value: (pledge.qty * pledge.price_target).toFixed(2),
            // Assuming 2% commission rate for example
            platform_commission: (pledge.qty * pledge.price_target * 0.02).toFixed(2), 
            commission_rate: 2,
            status: 'completed',
            executed_at: new Date().toISOString(),
          });

          await Pledge.update(pledge.id, { status: 'executed' });

          console.log(`✅ Executed ${pledge.side?.toUpperCase()} pledge ${pledge.id} for session ${session.id}`);
        } catch (error) {
          console.error(`❌ Failed to execute ${pledge.side?.toUpperCase()} for pledge ${pledge.id} in session ${session.id}:`, error);
          await Pledge.update(pledge.id, { status: 'failed', admin_notes: `Execution failed: ${error.message}` });
          // Continue to next pledge even if one fails
        }
      }

      // After attempting all pledges, update the session status to completed
      await PledgeSession.update(session.id, {
        status: 'completed',
        last_executed_at: new Date().toISOString()
      });

      console.log(`✅ Session ${session.id} execution completed`);
    } catch (error) {
      console.error(`❌ Error during session execution for session ${session.id}:`, error);
      throw error; // Re-throw to be caught by the main useEffect
    }
  };

  return null; // This is a background component
}
