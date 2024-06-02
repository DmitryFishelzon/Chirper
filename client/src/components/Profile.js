import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Profile.css';
import './Shared.css'; 

function Profile() {
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [editPostId, setEditPostId] = useState(null);
  const fileInputRef = useRef(null);

  // useEffect hook to fetch profile data when the component mounts
  useEffect(() => {
    // Function to fetch the user's profile data
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

  // Function to handle uploading the profile picture
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

  // Function to handle form submission for updating bio and uploading profile picture
  const handleSubmit = async (e) => {
    e.preventDefault();
    const imageUrl = await handleProfilePictureUpload();

    if (!imageUrl && profileImage) {
      setMessage('Profile picture upload failed. Please try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3001/updateBio', { bio: user.bio }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Bio updated successfully.');
    } catch (error) {
      console.error('Failed to update bio:', error);
      setMessage('Failed to update bio. Please try again.');
    }
  };

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

  // Function to handle deleting a post
  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error(error);
      setMessage('Failed to delete post. Please try again.');
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
          const updatedComments = post.comments.map(comment => comment._id === commentId ? { ...comment, replies: [...(comment.replies || []), { _id: response.data.reply._id, username: 'You', profilePicture: response.data.reply.profilePicture, reply, createdAt: new Date(), likes: [] }] } : comment);
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
    } catch (error) {
      console.error(error);
      setMessage('Failed to reply to comment. Please try again.');
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

  // Function to handle editing a post
  const handleEditPost = (postId) => {
    setEditPostId(postId);
  };

  // Function to handle updating a post
  const handleUpdatePost = async (e, postId) => {
    e.preventDefault();
    const content = e.target.elements.content.value;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/post/${postId}`, { content }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(posts.map(post => post._id === postId ? { ...post, content } : post));
      setEditPostId(null);
    } catch (error) {
      console.error('Failed to update post content', error);
      setMessage('Failed to update post content');
    }
  };

  return (
    <div className="profile-container container">
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
        <form onSubmit={handleSubmit}>
          <textarea
            value={user.bio || ''}
            onChange={(e) => setUser({ ...user, bio: e.target.value })}
            placeholder="Update your bio"
          />
          <button type="submit">Update Bio</button>
        </form>
      </div>
      <h3>Your Posts</h3>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <div className="post-header">
              <img src={user.profilePicture} alt="profile" className="profile-picture" />
              <p>{user.username}</p>
            </div>
            {editPostId === post._id ? (
              <form onSubmit={(e) => handleUpdatePost(e, post._id)}>
                <textarea name="content" defaultValue={post.content} />
                <button type="submit">Update Post</button>
              </form>
            ) : (
              <>
                <p>{post.content}</p>
                {post.image && <img src={post.image} alt="post" />}
                <p>Likes: {post.likesCount}</p>
                <button onClick={() => handleLike(post._id)}>Like</button>
                <button onClick={() => handleDeletePost(post._id)}>Delete</button>
                <button onClick={() => handleEditPost(post._id)}>Edit</button>
              </>
            )}
            <div>
              <input type="text" placeholder="Add a comment" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleComment(post._id, e.target.value);
                  e.target.value = '';
                }
              }} />
              <ul>
                {post.comments.map((comment) => (
                  <li key={comment._id}>
                    <div className="comment-header">
                      <img src={comment.profilePicture} alt="profile" className="profile-picture" />
                      <p><strong>{comment.username}</strong>: {comment.comment}</p>
                    </div>
                    <p>Likes: {comment.likes ? comment.likes.length : 0}</p>
                    <button onClick={() => handleLikeComment(post._id, comment._id)}>Like</button>
                    {(comment.username === user.username || post.username === user.username) && (
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
                              {(reply.username === user.username || post.username === user.username) && (
                                <button onClick={() => handleDeleteReply(post._id, comment._id, reply._id)}>Delete</button>
                              )}
                            </div>
                          </li>
                        )) : null}
                      </ul>
                    </div>
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

export default Profile;