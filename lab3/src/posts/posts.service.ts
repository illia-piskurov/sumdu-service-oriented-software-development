import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  create(createPostDto: CreatePostDto): Promise<Post> {
    const post = this.postsRepository.create(createPostDto);
    return this.postsRepository.save(post);
  }

  findAll(): Promise<Post[]> {
    return this.postsRepository.find();
  }

  findOne(id: number) {
    return this.postsRepository.findOne({
      where: { id },
    });
  }

  update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    return this.postsRepository.save({ ...updatePostDto, id });
  }

  remove(id: number) {
    return this.postsRepository.delete(id).then(() => undefined);
  }
}
