import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No token found, please log in.');
          return;
        }

        const response = await axios.get('http://localhost:3001/feed', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPosts(response.data);
      } catch (error) {
        console.error(error);
        setMessage('Failed to fetch posts. Please try again.');
      }
    };

    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/post/${postId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => post._id === postId ? { ...post, likes: post.likes + 1 } : post));
    } catch (error) {
      console.error(error);
      setMessage('Failed to like post. Please try again.');
    }
  };

  const handleComment = async (postId, comment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/post/${postId}/comment`, { comment }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => post._id === postId ? { ...post, comments: [...post.comments, { username: 'You', comment, createdAt: new Date() }] } : post));
    } catch (error) {
      console.error(error);
      setMessage('Failed to add comment. Please try again.');
    }
  };

  return (
    <div className="feed-container">
      <h2>Feed</h2>
      {message && <p>{message}</p>}
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <p>{post.content}</p>
            {post.image && <img src={post.image} alt="post" />}
            <p>Likes: {post.likes}</p>
            <button onClick={() => handleLike(post._id)}>Like</button>
            <div>
              <input type="text" placeholder="Add a comment" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleComment(post._id, e.target.value);
                  e.target.value = '';
                }
              }} />
              <ul>
                {post.comments.map((comment, index) => (
                  <li key={index}>
                    <p><strong>{comment.username}</strong>: {comment.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Feed;