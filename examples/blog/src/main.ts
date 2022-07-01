import { Query, Stable, Update, ic, nat, nat32 } from 'azle';

type BlogPost = {
    title: string;
    body: string;
    author: string;
    publish_date: nat;
    last_modified: nat;
};

let posts: Stable<BlogPost[]> = [];

export function getBlogPosts(): Query<BlogPost[]> {
    return posts;
}

export function listPosts(): Query<string> {
    return posts
        .map((obj, index) => {
            return `${index} ${obj.title}`;
        })
        .join('\n');
}

export function createPost(
    title: string,
    author: string,
    post: string
): Update<BlogPost> {
    const currentTime = ic.time();
    const blogPost: BlogPost = {
        title: title,
        body: post,
        author: author,
        publish_date: currentTime,
        last_modified: currentTime
    };
    posts = [...posts, blogPost];
    return blogPost;
}

export function readPost(number: nat32): Query<BlogPost> {
    return posts[number];
}

export function updatePost(
    number: nat32,
    updatedBody: string
): Update<BlogPost> {
    const updatedPost: BlogPost = {
        ...posts[number],
        body: updatedBody,
        last_modified: ic.time()
    };
    posts = posts.map((value: BlogPost, index: nat32) => {
        if (index === number) {
            return updatedPost;
        }
        return value;
    });
    return updatedPost;
}

export function deletePost(number: nat32): Update<void> {
    posts = posts.filter((value: BlogPost, index: number) => {
        return index !== number;
    });
}

export function getPostCount(): Query<nat32> {
    return posts.length;
}
