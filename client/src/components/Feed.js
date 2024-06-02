import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Feed.css';
import './Shared.css';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  // useEffect hook to fetch user data and posts when the component mounts
  useEffect(() => {
    // Function to fetch the current user's profile
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setMessage('No token found, please log in.');
          return;
        }

        const response = await axios.get('http://localhost:3001/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCurrentUser(response.data.user.username);
      } catch (error) {
        console.error(error);
        setMessage('Failed to fetch user data. Please try again.');
      }
    };

    // Function to fetch all posts for the feed
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

    fetchUser();
    fetchPosts();
  }, []);

  // Function to handle liking a post
  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/post/${postId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => post._id === postId ? { ...post, likesCount: post.likesCount + 1 } : post));
    } catch (error) {
      console.error(error);
      setMessage('Failed to like post. Please try again.');
    }
  };

  // Function to handle adding a comment to a post
  const handleComment = async (postId, comment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3001/post/${postId}/comment`, { comment }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => post._id === postId ? { ...post, comments: [...post.comments, response.data.comment] } : post));
    } catch (error) {
      console.error(error);
      setMessage('Failed to add comment. Please try again.');
    }
  };

  // Function to handle liking a comment
  const handleLikeComment = async (postId, commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3001/post/${postId}/comment/${commentId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const updatedComments = post.comments.map(comment => comment._id === commentId ? { ...comment, likes: [...(comment.likes || []), 'You'] } : comment);
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      console.error(error);
      setMessage('Failed to like comment. Please try again.');
    }
  };

  // Function to handle replying to a comment
  const handleReplyToComment = async (postId, commentId, reply) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3001/post/${postId}/comment/${commentId}/reply`, { reply }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const updatedComments = post.comments.map(comment => comment._id === commentId ? { ...comment, replies: [...(comment.replies || []), { _id: response.data.reply._id, username: currentUser, profilePicture: response.data.reply.profilePicture, reply, createdAt: new Date(), likes: [] }] } : comment);
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      console.error(error);
      setMessage('Failed to reply to comment. Please try again.');
    }
  };

  // Function to handle deleting a comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/post/${postId}/comment/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const updatedComments = post.comments.filter(comment => comment._id !== commentId);
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      console.error(error);
      setMessage('Failed to delete comment. Please try again.');
    }
  };

  // Function to handle deleting a reply to a comment
  const handleDeleteReply = async (postId, commentId, replyId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/post/${postId}/comment/${commentId}/reply/${replyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const updatedComments = post.comments.map(comment => {
            if (comment._id === commentId) {
              const updatedReplies = comment.replies.filter(reply => reply._id !== replyId);
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          });
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      console.error(error);
      setMessage('Failed to delete reply. Please try again.');
    }
  };

  // Function to handle liking a reply to a comment
  const handleLikeReply = async (postId, commentId, replyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3001/post/${postId}/comment/${commentId}/reply/${replyId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage(response.data.message);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const updatedComments = post.comments.map(comment => {
            if (comment._id === commentId) {
              const updatedReplies = comment.replies.map(reply => reply._id === replyId ? { ...reply, likes: [...(reply.likes || []), 'You'] } : reply);
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          });
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      console.error(error);
      setMessage('Failed to like reply. Please try again.');
    }
  };

  return (
    <div className="feed-container container">
      <h2>Feed</h2>
      {message && <p>{message}</p>}
      <ul>
        {posts.length > 0 ? posts.map((post) => (
          <li key={post._id}>
            <div className="post-header">
              <img src={post.profilePicture} alt="profile" className="profile-picture" />
              <p>{post.username}</p>
            </div>
            <p>{post.content}</p>
            {post.image && <img src={post.image} alt="post" />}
            <p>Likes: {post.likesCount}</p>
            <button onClick={() => handleLike(post._id)}>Like</button>
            <div>
              <input type="text" placeholder="Add a comment" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleComment(post._id, e.target.value);
                  e.target.value = '';
                }
              }} />
              <ul>
                {post.comments && post.comments.length > 0 ? post.comments.map((comment) => (
                  <li key={comment._id}>
                    <div className="comment-header">
                      <img src={comment.profilePicture} alt="profile" className="profile-picture" />
                      <p><strong>{comment.username}</strong>: {comment.comment}</p>
                    </div>
                    <p>Likes: {comment.likes ? comment.likes.length : 0}</p>
                    <button onClick={() => handleLikeComment(post._id, comment._id)}>Like</button>
                    {(comment.username === currentUser || post.username === currentUser) && (
                      <button onClick={() => handleDeleteComment(post._id, comment._id)}>Delete</button>
                    )}
                    <div>
                      <input type="text" placeholder="Reply to comment" onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleReplyToComment(post._id, comment._id, e.target.value);
                          e.target.value = '';
                        }
                      }} />
                      <ul>
                        {comment.replies && comment.replies.length > 0 ? comment.replies.map((reply) => (
                          <li key={reply._id}>
                            <div className="reply-header">
                              <img src={reply.profilePicture} alt="profile" className="profile-picture" />
                              <p><strong>{reply.username}</strong>: {reply.reply}</p>
                            </div>
                            <div className="reply-actions">
                              <p>Likes: {reply.likes ? reply.likes.length : 0}</p>
                              <button onClick={() => handleLikeReply(post._id, comment._id, reply._id)}>Like</button>
                              {(reply.username === currentUser || post.username === currentUser) && (
                                <button onClick={() => handleDeleteReply(post._id, comment._id, reply._id)}>Delete</button>
                              )}
                            </div>
                          </li>
                        )) : null}
                      </ul>
                    </div>
                  </li>
                )) : null}
              </ul>
            </div>
          </li>
        )) : <p>No posts available</p>}
      </ul>
    </div>
  );
}

export default Feed;