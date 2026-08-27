import React from 'react';
import { LoginPage } from './LoginPage';

export const Login = (props) => {
  return <LoginPage {...props} initialView="login" />;
};

export default Login;
