import express from 'express';
import { PrismaClient } from '@prisma/client';
import {authenticateToken} from '../utils/authMiddleware';
import multer from 'multer'
import {createClient} from '@supabase/supabase-js'


const router = express.Router();
const prisma = new PrismaClient();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 5 * 1024 * 1024}
});


router.get('/profile/:identifier', async (req, res)=>{
    try{
        const {identifier } = req.params;

        let user = await prisma.user.findUnique({
            where: {username: identifier},
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                profilePicture: true,
                bio: true,
                githubUrl: true,
                linkedinUrl: true,
                schoolCompany: true,
                createdAt: true,
                _count:{
                    select:{
                        followers: true,
                        following: true
                    }
                }
            }
        });

        if(!user){
            user = await prisma.user.findUnique({
                where: {username: identifier},
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    profilePicture: true,
                    bio: true,
                    githubUrl: true,
                    linkedinUrl: true,
                    schoolCompany: true,
                    createdAt: true,
                    _count:{
                        select:{
                            followers: true,
                            following: true
                        }
                    }
                }
            });
        }

        if(!user){
            return res.status(404).json({error: 'User not found'});
        }

        const post = await prisma.post.findMany({
            where:{
                userId: user.id
                // visibility: 'PUBLIC'
            },
            select: {
                id: true,
                title: true,
                header: true,
                techStack: true,
                category: true,
                difficulty: true,
                likes: true,
                views: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {createdAt: 'desc'}
        });
        let isFollowing = false;
        if(req.user){
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: req.user.id,
                        followingId: user.id
                    }
                }
            });
            isFollowing = !!follow;
        }
        res.json({
            user:{
                ...user,
                followers: user._count.followers,
                following: user._count.following,
                postsCount: user._count.posts
            },
            posts,
            isFollowing,
            isOwnProfile: req.user?.id === user.id
        });
    }catch (error){
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile'});
    }
});

router.put('/profile', authenticateToken, async(req, res)=>{
    try{
        const userId = req.user.id;
        const{
            name,
            bio,
            skills,
            githubUrl,
            linkedinUrl,
            schoolCompany
        } = req.body;

        if(skills && !Array.isArray(skills)){
            return res.status(400).json({error: 'Skills must be an array'});
        }
        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {
                ...(name && {name}),
                ...(bio !== undefined && { bio }),
                ...(skills && { skills }),
                ...(githubUrl !== undefined && { githubUrl }),
                ...(linkedinUrl !== undefined && { linkedinUrl }),
                ...(schoolCompany !== undefined && { schoolCompany })
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                profilePicture: true,
                bio: true,
                skills: true,
                githubUrl: true,
                linkedinUrl: true,
                schoolCompany: true
            }            
        });
        res.json({user: updatedUser});
    }catch(error){
        console.error('Error updating profile:', error);
        res.status(500).json({error: 'Failed to update profile'});
    }
});


router.post('/profile/picture', authenticateToken, upload.single('profilePicture'), async(req, res)=>{
    try{
        if(!req.file){
            return res.status(400).json({error: 'No file uploaded'});
        }
        const userId = req.user.id;
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `profile-pictures/${fileName}`;

        const { data, error} = await supabase.storage.from('avatars').upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            }
        );
        
        if(error){
            console.error('Supabase upload error:', error);
            return res.status(500).json({ error: 'Failed to upload image' });
        }

        const updateUser = await prisma.user.update({
            where: {id: userId},
            data: {profilePicture: publicUrl },
            select: {profilePicture: true}
        });

        res.json({
            message: 'Profile picture updated successfully',
            profilePicture: updatedUser.profilePicture 
        });

    }catch (error){
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: 'Failed to upload profile picture' });
    }
});

router.post('/profile/:userId/follow', authenticateToken, async(req, res)=>{
    try{
        const followerId = req.user.id;
        const {userId: followingId } = req.params;

        if(followerId === followingId){
            return res.status(400).json({error: 'Cannot follow yourself'});
        }

        const existingFollow = await prisma.follow.findUnique({
            where:{
                followerId_followingId: {
                    followerId,
                    followingId
                }
            }
        });

        if(existingFollow){
            await prisma.follow.delete({
                where: { id: existingFollow.id}
            });
            return res.json({ message: 'Unfollowed successfully', isFollowing: false});
        }else{
            await prisma.follow.create({
                data:{
                    followerId,
                    followingId
                }
            });
            return res.json({message: 'Followed Successfully', isFollowing: true});
        }

    }catch (error){
        console.error('Error following/unfollowing user:', error);
        res.status(500).json({error: 'Failed to follow/unfollow user'});
    }
});


router.get('/profile/:userId/followers', async(req, res)=>{
    try{
        const{userId} = req.params;
        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        profilePicture: true,
                        bio: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            followers: followers.map(f => f.follower),
            count: followers.length
        });
    }catch (error){
        console.error('Error fetching followers: ', error);
        res.status(500).json({error: 'Failed to fetch followers'});
    }
});


router.get('/profile/:userId/following', async (req, res)=>{
    try{
        const { userId } = req.params;

        const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
            following: {
            select: {
                id: true,
                name: true,
                username: true,
                profilePicture: true,
                bio: true
            }
            }
        },
        orderBy: { createdAt: 'desc' }
        });

        res.json({ 
        following: following.map(f => f.following),
        count: following.length 
        });
    }catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Failed to fetch following' });
  }
});

//do my projects visible by public.
