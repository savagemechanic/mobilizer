import { gql } from '@apollo/client';

export const GET_PRESIGNED_UPLOAD_URL = gql`
  mutation GetPresignedUploadUrl($type: String!, $fileName: String!, $contentType: String!) {
    getPresignedUploadUrl(type: $type, fileName: $fileName, contentType: $contentType) {
      uploadUrl
      fileUrl
      key
    }
  }
`;

export const CHECK_UPLOAD_CONFIGURED = gql`
  query CheckUploadConfigured {
    uploadConfigured
  }
`;
