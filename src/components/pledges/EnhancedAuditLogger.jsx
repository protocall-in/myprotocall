import { PledgeAuditLog, User } from '@/api/entities';

/**
 * Enhanced Audit Logger for Pledge Operations
 * Comprehensive logging for security, compliance, and troubleshooting
 */

export const logPledgeAction = async (action, data) => {
  try {
    const user = await User.me().catch(() => null);
    
    const auditEntry = {
      actor_id: data.userId || user?.id,
      actor_role: data.userRole || user?.app_role || 'user',
      action,
      target_type: data.targetType || 'pledge',
      target_pledge_id: data.pledgeId,
      target_session_id: data.sessionId,
      payload_json: JSON.stringify({
        ...data.payload,
        timestamp: new Date().toISOString(),
        sessionData: data.sessionData,
        tradingLimits: data.tradingLimits,
        validationResults: data.validationResults,
      }),
      ip_address: data.ipAddress || 'not-captured',
      user_agent: navigator.userAgent,
      success: data.success !== false,
      error_message: data.errorMessage || null,
    };

    await PledgeAuditLog.create(auditEntry);
    
    console.log(`📝 Audit Log: ${action}`, auditEntry);
    
    return true;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return false;
  }
};

// Predefined audit actions for consistency
export const AUDIT_ACTIONS = {
  PLEDGE_CREATED: 'pledge_created',
  PLEDGE_PAYMENT_INITIATED: 'pledge_payment_initiated',
  PLEDGE_PAYMENT_COMPLETED: 'payment_completed',
  PLEDGE_PAYMENT_FAILED: 'payment_failed',
  PLEDGE_CANCELLED: 'pledge_cancelled',
  PLEDGE_EXECUTION_STARTED: 'execution_started',
  PLEDGE_EXECUTION_COMPLETED: 'execution_completed',
  PLEDGE_EXECUTION_FAILED: 'execution_failed',
  SESSION_CREATED: 'session_created',
  SESSION_ACTIVATED: 'session_activated',
  SESSION_CLOSED: 'session_closed',
  SESSION_EXECUTED: 'session_executed',
  DEMAT_LINKED: 'demat_linked',
  DEMAT_VERIFIED: 'demat_verified',
  ACCESS_REQUESTED: 'access_requested',
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  CONSENT_SIGNED: 'consent_signed',
  RISK_ACKNOWLEDGED: 'risk_acknowledged',
  LIMIT_VALIDATION_PASSED: 'limit_validation_passed',
  LIMIT_VALIDATION_FAILED: 'limit_validation_failed',
  SECURITY_ALERT: 'security_alert',
};