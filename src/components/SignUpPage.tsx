import React from 'react';
import { LoginPage, LoginPageProps } from './LoginPage';

export interface SignUpPageProps extends Omit<LoginPageProps, 'initialView'> {}

export const SignUpPage: React.FC<SignUpPageProps> = (props) => {
  return <LoginPage {...props} initialView="signup" />;
};

export default SignUpPage;
