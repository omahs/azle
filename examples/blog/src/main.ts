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

let posts: { [key: string]: BlogPost } = {};

export function get_blog_posts(): Query<BlogPost[]> {
    return Object.values(posts);
}

export function get_blog_post_keys(): Query<string[]> {
    return Object.keys(posts);
}

// export function list_posts(): Query<string> {
//     return posts
//         .map((obj, index) => {
//             return `${index} ${obj.title}`;
//         })
//         .join('\n');
// }

export function create_post(
    title: string,
    author: string,
    post: string
): Update<BlogPost> {
    const current_time = ic.time();
    const blog_post: BlogPost = {
        title: title,
        body: post,
        author: author,
        publish_date: current_time,
        last_modified: current_time
    };
    const post_id = generate_id();
    console.log('This is the stuff');
    // posts = { ...posts, post_id: blog_post };
    posts[post_id.toString()] = blog_post;
    return blog_post;
}

export function read_post(number: nat32): Query<BlogPost> {
    return posts[number];
}

export function update_post(
    postID: string,
    updatedBody: string
): Update<BlogPost> {
    const updated_post: BlogPost = {
        ...posts[postID],
        body: updatedBody,
        last_modified: ic.time()
    };
    // TODO this feels mutaty to me...
    posts[postID] = updated_post;
    // posts = posts.map((value: BlogPost, index: nat32) => {
    //     if (index === postID) {
    //         return updated_post;
    //     }
    //     return value;
    // });
    return updated_post;
}

export function delete_post(postID: string): Update<void> {
    // TODO this feels mutaty to me...
    delete posts[postID];
    // posts = posts.filter((value: BlogPost, index: number) => {
    //     return index !== postID;
    // });
}

export function get_post_count(): Query<nat32> {
    return Object.keys(posts).length;
}

export function* generate_id(): Update<string> {
    const randomness_canister_result: CanisterResult<blob> =
        yield ManagementCanister.raw_rand();

    if (!ok(randomness_canister_result)) {
        return randomness_canister_result.err === undefined
            ? 'undefined'
            : randomness_canister_result.err;
    }
    return sha224()
        .update(Array.from(randomness_canister_result.ok))
        .digest('hex');
}
