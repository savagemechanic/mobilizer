import { gql } from '@apollo/client'

export const GET_FEED = gql`
  query GetFeed($limit: Float, $offset: Float) {
    feed(limit: $limit, offset: $offset) {
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

export const GET_POST = gql`
  query GetPost($id: String!) {
    post(id: $id) {
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

export const GET_POLLS = gql`
  query GetPolls($limit: Float, $offset: Float, $organizationId: String) {
    polls(limit: $limit, offset: $offset, organizationId: $organizationId) {
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
