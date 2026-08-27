import React from 'react';
import { UserProfilePage } from './UserProfilePage';
import { ProfileModal } from './ProfileModal';

export const Profile = (props) => {
  if (props.isModal) {
    return <ProfileModal {...props} />;
  }
  return <UserProfilePage {...props} />;
};

export default Profile;
