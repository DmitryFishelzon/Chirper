import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get('/api/user/1')
      .then(response => {
        setProfile(response.data);
      })
      .catch(error => console.log(error));
  }, []);

  return (
    <div>
      {profile ? (
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.bio}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}

export default Profile;