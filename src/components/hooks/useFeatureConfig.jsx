import { useContext } from 'react';
import { FeatureConfigContext } from '../context/FeatureConfigProvider';

export const useFeatureConfig = () => {
  const context = useContext(FeatureConfigContext);
  if (!context) {
    throw new Error('useFeatureConfig must be used within a FeatureConfigProvider');
  }
  return context;
};