// SAMPLE NOTIFICATIONS FOR FUND MANAGER

export const SAMPLE_NOTIFICATIONS = {
  // 1. WALLET CREDIT NOTIFICATION
  wallet_credit: {
    title: "Wallet Credit Alert",
    message: "Investor INV001 (Rajesh Kumar) credited ₹50,000 to wallet via upi.",
    type: "info",
    meta: {
      investor_id: "inv_12345",
      investor_code: "INV001",
      investor_name: "Rajesh Kumar",
      amount: 50000,
      payment_method: "upi",
      payment_id: "pay_abc123xyz",
      action: "wallet_credit",
      timestamp: "2025-01-15T10:30:00Z"
    }
  },

  // 2. INVESTMENT REQUEST NOTIFICATION
  investment_request: {
    title: "New Investment Request",
    message: "Investor INV001 (Rajesh Kumar) requested investment of ₹50,000 in Growth Fund. Funds locked in wallet.",
    type: "info",
    meta: {
      investor_id: "inv_12345",
      investor_code: "INV001",
      investor_name: "Rajesh Kumar",
      amount: 50000,
      fund_plan_id: "plan_456",
      fund_plan_name: "Growth Fund",
      investment_request_id: "req_789",
      action: "investment_request",
      wallet_balance: 50000,
      timestamp: "2025-01-15T10:35:00Z"
    }
  },

  // 3. WITHDRAWAL REQUEST NOTIFICATION
  withdrawal_request: {
    title: "Withdrawal Request",
    message: "Investor INV001 (Rajesh Kumar) requested withdrawal of ₹25,000 from Equity Fund. Notice period: 30 days.",
    type: "warning",
    meta: {
      investor_id: "inv_12345",
      investor_code: "INV001",
      investor_name: "Rajesh Kumar",
      amount: 25000,
      fund_plan_id: "plan_123",
      fund_plan_name: "Equity Fund",
      withdrawal_request_id: "with_101",
      withdrawal_type: "partial",
      notice_period_days: 30,
      expected_processing_date: "2025-02-14",
      action: "withdrawal_request",
      timestamp: "2025-01-15T11:00:00Z"
    }
  },

  // 4. NEW INVESTOR REGISTRATION
  new_registration: {
    title: "New Investor Registration",
    message: "New investor registration from Rajesh Kumar (rajesh@email.com) - Status: Pending Review",
    type: "info",
    meta: {
      user_id: "user_999",
      email: "rajesh@email.com",
      full_name: "Rajesh Kumar",
      mobile_number: "+91-9876543210",
      investor_request_id: "req_888",
      action: "investor_registration",
      timestamp: "2025-01-15T09:00:00Z"
    }
  },

  // 5. PAYOUT REQUEST NOTIFICATION
  payout_request: {
    title: "Payout Request",
    message: "Investor INV001 (Rajesh Kumar) requested payout of ₹30,000 from wallet to bank account.",
    type: "info",
    meta: {
      investor_id: "inv_12345",
      investor_code: "INV001",
      investor_name: "Rajesh Kumar",
      amount: 30000,
      payout_request_id: "payout_555",
      bank_account_number: "****6789",
      bank_name: "HDFC Bank",
      action: "payout_request",
      wallet_balance: 50000,
      timestamp: "2025-01-15T14:00:00Z"
    }
  },

  // 6. ALLOCATION EXECUTED (sent by admin)
  allocation_executed: {
    title: "Allocation Executed",
    message: "Allocation executed for Investor INV001: ₹50,000 at NAV ₹12.50 (4,000 units) in Growth Fund",
    type: "info",
    meta: {
      investor_id: "inv_12345",
      investor_code: "INV001",
      investor_name: "Rajesh Kumar",
      amount: 50000,
      nav: 12.50,
      units: 4000,
      fund_plan_id: "plan_456",
      fund_plan_name: "Growth Fund",
      allocation_id: "alloc_777",
      action: "allocation_executed",
      executed_by: "admin_001",
      timestamp: "2025-01-15T15:00:00Z"
    }
  },

  // 7. KYC UPDATE NOTIFICATION
  kyc_update: {
    title: "KYC Document Updated",
    message: "Investor INV001 (Rajesh Kumar) uploaded new PAN card document for verification.",
    type: "info",
    meta: {
      investor_id: "inv_12345",
      investor_code: "INV001",
      investor_name: "Rajesh Kumar",
      document_type: "PAN Card",
      document_url: "https://storage/documents/pan_123.pdf",
      action: "kyc_update",
      timestamp: "2025-01-15T12:00:00Z"
    }
  },

  // 8. SYSTEM ALERT - LOW FUND BALANCE
  system_alert_low_balance: {
    title: "System Alert: Low Fund Balance",
    message: "Growth Fund available balance is below threshold (₹5,00,000). Current balance: ₹3,50,000",
    type: "alert",
    meta: {
      fund_plan_id: "plan_456",
      fund_plan_name: "Growth Fund",
      current_balance: 350000,
      threshold: 500000,
      action: "system_alert",
      alert_type: "low_balance",
      timestamp: "2025-01-15T16:00:00Z"
    }
  }
};

// HOW THEY APPEAR IN THE UI:

export const NOTIFICATION_UI_EXAMPLES = `
┌──────────────────────────────────────────────────────────────────┐
│ 🔔 Notification Center                            [3 new]        │
├──────────────────────────────────────────────────────────────────┤
│ [All][Wallet][Investments][Withdrawals][Registrations]          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 📢 Wallet Credit Alert                      [New] 🕐 2m ago│  │
│ │ Investor INV001 (Rajesh Kumar) credited ₹50,000 to        │  │
│ │ wallet via upi.                                            │  │
│ │                                                            │  │
│ │ ┌──────────────────────────────────────────────────────┐  │  │
│ │ │ Investor: INV001          Amount: ₹50,000          │  │  │
│ │ │ Method: UPI                                          │  │  │
│ │ └──────────────────────────────────────────────────────┘  │  │
│ │                                           [✓][View][🗑️]  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 📢 New Investment Request                       🕐 5m ago  │  │
│ │ Investor INV001 (Rajesh Kumar) requested investment of    │  │
│ │ ₹50,000 in Growth Fund. Funds locked in wallet.          │  │
│ │                                                            │  │
│ │ ┌──────────────────────────────────────────────────────┐  │  │
│ │ │ Investor: INV001          Amount: ₹50,000          │  │  │
│ │ │ Plan: Growth Fund                                    │  │  │
│ │ └──────────────────────────────────────────────────────┘  │  │
│ │                                           [✓][View][🗑️]  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Withdrawal Request                           🕐 1h ago  │  │
│ │ Investor INV001 (Rajesh Kumar) requested withdrawal of    │  │
│ │ ₹25,000 from Equity Fund. Notice period: 30 days.        │  │
│ │                                                            │  │
│ │ ┌──────────────────────────────────────────────────────┐  │  │
│ │ │ Investor: INV001          Amount: ₹25,000          │  │  │
│ │ │ Plan: Equity Fund         Type: Partial              │  │  │
│ │ │ Expected Processing: Feb 14, 2025                    │  │  │
│ │ └──────────────────────────────────────────────────────┘  │  │
│ │                                                  [✓][🗑️]  │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 📢 New Investor Registration              [Read] 🕐 2h ago │  │
│ │ New investor registration from Rajesh Kumar               │  │
│ │ (rajesh@email.com) - Status: Pending Review              │  │
│ │                                                  [View][🗑️]│  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
    [⚙️ Notification Settings]                      [Refresh]
`;