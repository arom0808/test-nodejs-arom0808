import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rfc3339 } from '../common/rfc3339';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  public async newPost(
    userId: number,
    content: string,
    tags: string[],
  ): Promise<PostOutDto> {
    const {
      id,
      author: { login: author },
      createdAt,
      _count: { usersLiked: likesCount, usersDisliked: dislikesCount },
    } = await this.prisma.post.create({
      data: { content, tags, authorId: userId, createdAt: new Date() },
      select: {
        id: true,
        author: { select: { login: true } },
        createdAt: true,
        _count: { select: { usersDisliked: true, usersLiked: true } },
      },
    });
    return {
      id: id.toString(),
      content,
      author,
      tags,
      createdAt: rfc3339(createdAt),
      likesCount,
      dislikesCount,
    };
  }

  private ThrowNoPostFoundException() {
    throw new HttpException(
      'No post was found that is available to you and has such an id',
      HttpStatus.NOT_FOUND,
    );
  }

  public async getPost(userId: number, postId: string): Promise<PostOutDto> {
    const numPostId = parseInt(postId);
    if (isNaN(numPostId)) this.ThrowNoPostFoundException();
    const post = await this.prisma.post.findUnique({
      where: { id: numPostId },
      select: {
        content: true,
        author: {
          select: {
            id: true,
            login: true,
            isPublic: true,
            friendsAsA: { where: { bId: userId }, select: { aId: true } },
          },
        },
        tags: true,
        createdAt: true,
        _count: { select: { usersLiked: true, usersDisliked: true } },
      },
    });
    if (
      post === null ||
      (post.author.id !== userId &&
        !post.author.isPublic &&
        post.author.friendsAsA.length < 1)
    )
      this.ThrowNoPostFoundException();
    return {
      id: postId,
      content: post.content,
      author: post.author.login,
      tags: post.tags,
      createdAt: rfc3339(post.createdAt),
      likesCount: post._count.usersLiked,
      dislikesCount: post._count.usersDisliked,
    };
  }

  public async getFeed(
    userId: number,
    limit: number,
    offset: number,
    login?: string,
  ): Promise<PostOutDto[]> {
    const userWhere = login === undefined ? { id: userId } : { login };
    const user = await this.prisma.user.findUnique({
      where: userWhere,
      select: {
        id: true,
        login: true,
        isPublic: true,
        posts: {
          select: {
            id: true,
            content: true,
            tags: true,
            createdAt: true,
            _count: { select: { usersLiked: true, usersDisliked: true } },
          },
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        },
        friendsAsA: { where: { bId: userId }, select: { aId: true } },
      },
    });
    if (
      user === null ||
      (login !== undefined &&
        user.id !== userId &&
        !user.isPublic &&
        user.friendsAsA.length < 1)
    )
      throw new HttpException(
        'No profile was found with the same username that you have access to',
        HttpStatus.NOT_FOUND,
      );
    return user.posts.map((v) => ({
      id: v.id.toString(),
      content: v.content,
      author: user.login,
      tags: v.tags,
      createdAt: rfc3339(v.createdAt),
      likesCount: v._count.usersLiked,
      dislikesCount: v._count.usersDisliked,
    }));
  }

  public async likeDislikePost(
    userId: number,
    postId: string,
    like: boolean,
  ): Promise<PostOutDto> {
    const numPostId = parseInt(postId);
    if (isNaN(numPostId)) this.ThrowNoPostFoundException();
    try {
      const [
        { id: _ },
        { id: __ },
        {
          id,
          content,
          author: { login: author },
          tags,
          createdAt,
          _count: { usersLiked: likesCount, usersDisliked: dislikesCount },
        },
      ] = await this.prisma.$transaction([
        this.prisma.post.findUniqueOrThrow({
          where: {
            id: numPostId,
            author: {
              OR: [
                { friendsAsA: { some: { bId: userId } } },
                { id: userId },
                { isPublic: true },
              ],
            },
          },
          select: { id: true },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: {
            likedPosts: like
              ? { connect: { id: numPostId } }
              : { disconnect: { id: numPostId } },
            dislikedPosts: like
              ? { disconnect: { id: numPostId } }
              : { connect: { id: numPostId } },
          },
          select: { id: true },
        }),
        this.prisma.post.findUniqueOrThrow({
          where: { id: numPostId },
          select: {
            id: true,
            content: true,
            author: { select: { login: true } },
            tags: true,
            createdAt: true,
            _count: { select: { usersLiked: true, usersDisliked: true } },
          },
        }),
      ]);
      return {
        id: id.toString(),
        content,
        author,
        tags,
        createdAt: rfc3339(createdAt),
        likesCount,
        dislikesCount,
      };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') this.ThrowNoPostFoundException();
      }
      throw e;
    }
  }
}
