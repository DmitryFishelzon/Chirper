import React, { useState, useRef } from 'react';
import axios from 'axios';
import './Post.css';

function Post() {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async () => {
    if (!image) return null;

    const formData = new FormData();
    formData.append('image', image);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/uploadPostImage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.imagePath;
    } catch (error) {
      console.error(error);
      setMessage('Image upload failed. Please try again.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const imageUrl = await handleImageUpload();

    if (!imageUrl && image) {
      setMessage('Image upload failed. Please try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/post', { content, image: imageUrl }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Post created successfully');
      setContent('');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      setMessage('Post creation failed. Please try again.');
    }
  };

  return (
    <div className="post-container">
      <h2>Create a Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength="280"
          placeholder="What's happening?"
          required
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit">Post</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Post;