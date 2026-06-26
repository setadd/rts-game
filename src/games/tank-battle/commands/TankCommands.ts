export interface TankMovePayload {
  move: number
  turn: number
}

export interface TankAimPayload {
  yaw: number
}

export interface TankFirePayload {
  requestId: string
}
