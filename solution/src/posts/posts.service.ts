import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rfc3339 } from '../common/rfc3339';

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

  // public async getFeed(userId: number, login?: string) {
  //   this.prisma.post.findMany({
  //     where:{author:{login:}},
  //
  //   })
  // }
}
