import React from 'react';
import Layout from '../../components/layout/Layout';
import UnauthorizedPage from './UnauthorizedPage';

const UnauthorizedPageWithLayout = () => {
  return (
    <Layout showFooter={false}>
      <UnauthorizedPage />
    </Layout>
  );
};

export default UnauthorizedPageWithLayout;
