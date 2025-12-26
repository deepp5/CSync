import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifySupabaseToken } from "../utils/authMiddleware.js";


const router = express.Router();
const prisma = new PrismaClient();

// // Middleware to verify Supabase JWT and extract user
// const authenticateUser = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     // The token contains the user info - extract the user ID
//     // Supabase JWT should be verified here in production
//     req.userId = req.user?.id || req.headers['x-user-id'];
//     next();
//   } catch (error) {
//     return res.status(401).json({ error: 'Invalid token' });
//   }
// };


// GET /api/profile/me - Get current user's profile
router.get('/me', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        skills: true,
        githubUrl: true,
        linkedinUrl: true,
        profilePicture: true,
        schoolCompany: true,
        profileVisibility: true,
        showEmail: true,
        allowMessages: true,
        _count: {
          select: {
            Follow_Follow_followerIdToUser: true,
            Follow_Follow_followingIdToUser: true,
            Post: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/profile/update - Update current user's profile
router.put('/update', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      bio,
      skills,
      githubUrl,
      linkedinUrl,
      schoolCompany,
      showEmail,
      allowMessages
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(schoolCompany !== undefined && { schoolCompany }),
        ...(showEmail !== undefined && { showEmail }),
        ...(allowMessages !== undefined && { allowMessages })
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        skills: true,
        githubUrl: true,
        linkedinUrl: true,
        schoolCompany: true,
        showEmail: true,
        allowMessages: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/profile/:username/posts - Get user's posts
router.get('/:username/posts', async (req, res) => {
  try {
    const { username } = req.params;
    const requestingUserId = req.headers['x-user-id'];

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine which posts to show based on ownership
    const isOwnProfile = user.id === requestingUserId;
    
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        visibility: isOwnProfile 
          ? undefined // Show all posts if viewing own profile
          : 'PUBLIC'  // Only show public posts for others
      },
      include: {
        User: {
          select: {
            name: true,
            username: true,
            profilePicture: true
          }
        },
        _count: {
          select: {
            Like: true,
            Comment: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/profile/:username/followers - Get user's followers
router.get('/:username/followers', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = await prisma.follow.findMany({
      where: {
        followingId: user.id
      },
      include: {
        User_Follow_followerIdToUser: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
            bio: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const followersList = followers.map(f => f.User_Follow_followerIdToUser);
    res.json(followersList);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/profile/:username/following - Get users this user follows
router.get('/:username/following', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = await prisma.follow.findMany({
      where: {
        followerId: user.id
      },
      include: {
        User_Follow_followingIdToUser: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
            bio: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const followingList = following.map(f => f.User_Follow_followingIdToUser);
    res.json(followingList);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// POST /api/profile/:username/follow - Follow a user
router.post('/:username/follow', verifySupabaseToken, async (req, res) => {
  try {
    const { username } = req.params;
    const followerId = req.use.id;

    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToFollow.id === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: userToFollow.id
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        followerId: followerId,
        followingId: userToFollow.id
      }
    });

    res.json({ success: true, follow });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /api/profile/:username/follow - Unfollow a user
router.delete('/:username/follow', verifySupabaseToken, async (req, res) => {
  try {
    const { username } = req.params;
    const followerId = req.user.id;

    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!userToUnfollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: followerId,
        followingId: userToUnfollow.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/profile/:username/follow-status - Check if current user follows this user
router.get('/:username/follow-status', verifySupabaseToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    const userToCheck = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!userToCheck) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userToCheck.id
        }
      }
    });

    res.json({ isFollowing: !!isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// GET /api/profile/:username - Get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        skills: true,
        githubUrl: true,
        linkedinUrl: true,
        profilePicture: true,
        schoolCompany: true,
        showEmail: true,
        createdAt: true,
        _count: {
          select: {
            Follow_Follow_followerIdToUser: true,  // followers
            Follow_Follow_followingIdToUser: true, // following
            Post: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format response
    const profileData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.showEmail ? user.email : null,
      bio: user.bio,
      skills: user.skills,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      profilePicture: user.profilePicture,
      schoolCompany: user.schoolCompany,
      createdAt: user.createdAt,
      stats: {
        followers: user._count.Follow_Follow_followerIdToUser,
        following: user._count.Follow_Follow_followingIdToUser,
        posts: user._count.Post
      }
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


export default router;