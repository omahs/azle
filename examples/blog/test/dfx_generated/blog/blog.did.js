export const idlFactory = ({ IDL }) => {
    const BlogPost = IDL.Record({
        title: IDL.Text,
        body: IDL.Text,
        author: IDL.Text,
        last_modified: IDL.Nat,
        publish_date: IDL.Nat
    });
    return IDL.Service({
        createPost: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [BlogPost], []),
        deletePost: IDL.Func([IDL.Nat32], [], []),
        getBlogPosts: IDL.Func([], [IDL.Vec(BlogPost)], ['query']),
        getPostCount: IDL.Func([], [IDL.Nat32], ['query']),
        listPosts: IDL.Func([], [IDL.Text], ['query']),
        readPost: IDL.Func([IDL.Nat32], [BlogPost], ['query']),
        updatePost: IDL.Func([IDL.Nat32, IDL.Text], [BlogPost], [])
    });
};
export const init = ({ IDL }) => {
    return [];
};
