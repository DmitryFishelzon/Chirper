import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);
        setPosts(response.data.posts);
      } catch (error) {
        console.error(error);
        setMessage('Failed to fetch profile data. Please try again.');
      }
    };

    fetchProfile();
  }, []);

  const handleProfilePictureUpload = async () => {
    if (!profileImage) return null;

    const formData = new FormData();
    formData.append('image', profileImage);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/uploadProfilePicture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setUser({ ...user, profilePicture: response.data.imagePath });
      return response.data.imagePath;
    } catch (error) {
      console.error(error);
      setMessage('Profile picture upload failed. Please try again.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const imageUrl = await handleProfilePictureUpload();

    if (!imageUrl && profileImage) {
      setMessage('Profile picture upload failed. Please try again.');
      return;
    }
  };

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {message && <p>{message}</p>}
      <div>
        <h3>{user.username}</h3>
        {user.profilePicture && <img className="profile-picture" src={user.profilePicture} alt="Profile" />}
        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
          />
          <button type="submit">Upload Profile Picture</button>
        </form>
      </div>
      <h3>Your Posts</h3>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <p>{post.content}</p>
            {post.image && <img src={post.image} alt="post" />}
            <p>Likes: {post.likes}</p>
            <ul>
              {post.comments.map((comment, index) => (
                <li key={index}>
                  <p><strong>{comment.username}</strong>: {comment.comment}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Profile;