import React from 'react';
import { LoginPage } from './LoginPage';

export const Register = (props) => {
  return <LoginPage {...props} initialView="signup" />;
};

export default Register;
