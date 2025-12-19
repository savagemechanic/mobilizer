import { gql } from '@apollo/client'

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      type
      authorId
      orgId
      isPublished
      likeCount
      commentCount
      shareCount
      viewCount
      mediaUrls
      createdAt
      updatedAt
      author {
        id
        firstName
        lastName
        displayName
        avatar
      }
      organization {
        id
        name
        logo
      }
      poll {
        id
        postId
        question
        endsAt
        allowMultiple
        createdAt
        options {
          id
          pollId
          text
          voteCount
        }
      }
    }
  }
`

export const LIKE_POST = gql`
  mutation LikePost($postId: String!) {
    likePost(postId: $postId)
  }
`

export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: String!) {
    unlikePost(postId: $postId)
  }
`

export const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`
