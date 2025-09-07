import React from 'react';
import Layout from '../../components/layout/Layout';
import LoginPage from './LoginPage';

const LoginPageWithLayout = () => {
  return (
    <Layout showFooter={false}>
      <LoginPage />
    </Layout>
  );
};

export default LoginPageWithLayout;
