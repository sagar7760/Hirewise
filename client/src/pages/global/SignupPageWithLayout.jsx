import React from 'react';
import Layout from '../../components/layout/Layout';
import SignupPage from './SignupPage';

const SignupPageWithLayout = () => {
  return (
    <Layout showFooter={false}>
      <SignupPage />
    </Layout>
  );
};

export default SignupPageWithLayout;
