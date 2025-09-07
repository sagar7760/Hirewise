import React from 'react';
import Layout from '../../components/layout/Layout';
import NotFoundPage from './NotFoundPage';

const NotFoundPageWithLayout = () => {
  return (
    <Layout showFooter={false}>
      <NotFoundPage />
    </Layout>
  );
};

export default NotFoundPageWithLayout;
