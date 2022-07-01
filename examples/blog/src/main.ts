import {
    Async,
    CanisterResult,
    Query,
    Stable,
    Update,
    blob,
    ic,
    nat,
    nat32,
    ok
} from 'azle';
import { sha224 } from 'hash.js';
import { ManagementCanister } from 'azle/canisters/management';

type BlogPost = {
    title: string;
    body: string;
    author: string;
    publish_date: nat;
    last_modified: nat;
};

let posts: {[key: string]: BlogPost} = {};

export function get_blog_posts(): Query<{[key: string]: BlogPost}> {
    return posts;
}

export function list_posts(): Query<string> {
    return posts
        .map((obj, index) => {
            return `${index} ${obj.title}`;
        })
        .join('\n');
}

export function create_post(
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

export function read_post(number: nat32): Query<BlogPost> {
    return posts[number];
}

export function update_post(
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

export function delete_post(number: nat32): Update<void> {
    posts = posts.filter((value: BlogPost, index: number) => {
        return index !== number;
    });
}

export function get_post_count(): Query<nat32> {
    return posts.length;
}

export function* generate_id(): Update<string> {
    const randomness_canister_result: CanisterResult<blob> =
        yield ManagementCanister.raw_rand();

    if (!ok(randomness_canister_result)) {
        return randomness_canister_result.err === undefined ? 'undefined' : randomness_canister_result.err;
    }
    return sha224().update(Array.from(randomness_canister_result.ok)).digest('hex');
}
