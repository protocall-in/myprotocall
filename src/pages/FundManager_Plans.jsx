import React from 'react';
import FundManagerLayout from '../components/layouts/FundManagerLayout';
import FundPlansManager from '../components/superadmin/fundmanager/FundPlansManager';

export default function FundManager_Plans() {
  return (
    <FundManagerLayout activePage="plans">
      <div className="p-8">
        <FundPlansManager />
      </div>
    </FundManagerLayout>
  );
}