import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { NewPostDto } from './dto/new-post.dto';
import { PostsService } from './posts.service';
import {
  PaginationLimit,
  PaginationOffset,
} from '../common/decorators/limit.decorator';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post('new')
  @HttpCode(HttpStatus.OK)
  newPost(
    @Request() { userId }: { userId: number },
    @Body(ValidationPipe) { content, tags }: NewPostDto,
  ) {
    return this.postsService.newPost(userId, content, tags);
  }

  @Get(':postId')
  getPost(
    @Request() { userId }: { userId: number },
    @Param() { postId }: { postId: string },
  ) {
    return this.postsService.getPost(userId, postId);
  }

  @Get('feed/my')
  getMyFeed(
    @Request() { userId }: { userId: number },
    @PaginationLimit() limit: number,
    @PaginationOffset() offset: number,
  ) {
    return this.postsService.getFeed(userId, limit, offset);
  }

  @Get('feed/:login')
  getFeed(
    @Request() { userId }: { userId: number },
    @PaginationLimit() limit: number,
    @PaginationOffset() offset: number,
    @Param() { login }: { login: string },
  ) {
    return this.postsService.getFeed(userId, limit, offset, login);
  }

  @Post(':postId/like')
  @HttpCode(HttpStatus.OK)
  likePost(
    @Request() { userId }: { userId: number },
    @Param() { postId }: { postId: string },
  ) {
    return this.postsService.likeDislikePost(userId, postId, true);
  }

  @Post(':postId/dislike')
  @HttpCode(HttpStatus.OK)
  dislikePost(
    @Request() { userId }: { userId: number },
    @Param() { postId }: { postId: string },
  ) {
    return this.postsService.likeDislikePost(userId, postId, false);
  }
}
