import uuid from 'uuid';

export const RoomLinkRequestResolution = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  UNRESOLVED: 'unresolved',
};

export class RoomLinkRequest {
  constructor(name, email) {
    this.requestID = uuid.v4();
    this.name = name;
    this.email = email;
    this.resolution = RoomLinkRequestResolution.UNRESOLVED;
    this.createdTime = new Date();
    this.resolvedTime = null;
  }
}
