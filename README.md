# Chirper

Chirper is a social media application built with the MERN stack, where users can share posts, comment on posts, like posts, and interact with each other. This README provides an overview of the project, its features, and details about its components.

## Overview

Chirper is a simple yet powerful social media platform that allows users to express themselves through short posts. Users can interact with each other by liking posts, commenting on them, and replying to comments. The application ensures a smooth user experience by implementing authentication and authorization mechanisms.

## Features

- **User Registration and Login:** Users can create an account and log in to the application.
- **Profile Management:** Users can upload a profile picture and update their bio.
- **Posting:** Users can create new posts with text and images.
- **Post Interaction:** Users can like posts, comment on posts, and reply to comments.
- **Comment Interaction:** Users can like comments and delete their own comments.
- **Reply Interaction:** Users can like replies to comments and delete their own replies.
- **Post Management:** Users can update and delete their own posts.

## Components

### Login

The Login component handles user authentication. Users enter their username and password to log in. Upon successful login, a token is stored in local storage, allowing access to protected routes.

### Register

The Register component allows new users to create an account by providing a username and password. It also includes client-side validation to ensure the required fields are filled out.

### NavBar

The NavBar component provides navigation links to the Feed, Profile, and Post pages. It also includes a logout button that clears the token from local storage and redirects the user to the login page.

### Feed

The Feed component displays all posts from all users. Users can like posts, comment on them, and reply to comments. The feed dynamically updates to show the latest interactions.

### Profile

The Profile component displays the logged-in user's profile information, including their bio and profile picture. Users can upload a new profile picture and update their bio. The profile also lists all posts created by the user, allowing them to like, comment, reply, update, and delete their posts.

### Post

The Post component allows users to create new posts by entering text and optionally uploading an image. Upon submission, the post is added to the feed and the user's profile.