import type { Principal } from '@dfinity/principal';
export interface BlogPost {
    title: string;
    body: string;
    author: string;
    last_modified: bigint;
    publish_date: bigint;
}
export interface _SERVICE {
    createPost: (
        arg_0: string,
        arg_1: string,
        arg_2: string
    ) => Promise<BlogPost>;
    deletePost: (arg_0: number) => Promise<undefined>;
    getBlogPosts: () => Promise<Array<BlogPost>>;
    getPostCount: () => Promise<number>;
    listPosts: () => Promise<string>;
    readPost: (arg_0: number) => Promise<BlogPost>;
    updatePost: (arg_0: number, arg_1: string) => Promise<BlogPost>;
}
