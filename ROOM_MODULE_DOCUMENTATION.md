# Tài Liệu Module Room - Frontend Implementation Guide

## Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Message Types](#message-types)
3. [Cấu Trúc Dữ Liệu](#cấu-trúc-dữ-liệu)
4. [Constants](#constants)
5. [Status Codes](#status-codes)
6. [Các Chức Năng](#các-chức-năng)
7. [Message Format](#message-format)
8. [Ví Dụ Implementation](#ví-dụ-implementation)

---

## Tổng Quan

Module Room quản lý việc tạo phòng, tham gia phòng, rời phòng và cập nhật thông tin phòng. Module này cung cấp các chức năng cơ bản để người chơi có thể tạo và tham gia các phòng chơi game.

### Các Trạng Thái Phòng (Room States)
- `ROOM_WAITING` (0): Đang chờ người chơi
- `ROOM_PLAYING` (1): Đang chơi game
- `ROOM_FINISHED` (2): Game đã kết thúc

### Các Trạng Thái Client
- `CLIENT_STATE_LOGGED_OUT` (0): Chưa đăng nhập
- `CLIENT_STATE_LOGGED_IN` (1): Đã đăng nhập, chưa trong phòng
- `CLIENT_STATE_IN_ROOM` (2): Đang trong phòng chờ
- `CLIENT_STATE_IN_GAME` (3): Đang chơi game

---

## Message Types

### Request Messages (Client → Server)

| Message Type | Giá Trị | Mô Tả |
|-------------|---------|-------|
| `MSG_ROOM_LIST_REQUEST` | 0x10 | Yêu cầu lấy danh sách phòng |
| `MSG_CREATE_ROOM` | 0x12 | Tạo phòng mới |
| `MSG_JOIN_ROOM` | 0x13 | Tham gia phòng |
| `MSG_LEAVE_ROOM` | 0x14 | Rời phòng |
| `MSG_START_GAME` | 0x16 | Bắt đầu game (chỉ owner) |

### Response Messages (Server → Client)

| Message Type | Giá Trị | Mô Tả |
|-------------|---------|-------|
| `MSG_ROOM_LIST_RESPONSE` | 0x11 | Danh sách phòng |
| `MSG_ROOM_UPDATE` | 0x15 | Cập nhật thông tin phòng |
| `MSG_ROOM_PLAYERS_UPDATE` | 0x17 | Cập nhật danh sách người chơi |

---

## Cấu Trúc Dữ Liệu

### 1. CREATE_ROOM Request

**Message Type:** `MSG_CREATE_ROOM` (0x12)

```javascript
{
  room_name: string,      // Tên phòng (max 32 ký tự)
  max_players: uint8,     // Số người chơi tối đa (2-10)
  rounds: uint8           // Số round trong game (1-10)
}
```

**Response:** `MSG_CREATE_ROOM` (0x12) - Sử dụng cùng message type

```javascript
{
  status: uint8,          // STATUS_SUCCESS (0x00) hoặc STATUS_ERROR (0x01)
  room_id: int32,         // ID của phòng (hoặc -1 nếu thất bại)
  message: string         // Thông báo (max 128 ký tự)
}
```

### 2. JOIN_ROOM Request

**Message Type:** `MSG_JOIN_ROOM` (0x13)

```javascript
{
  room_id: int32          // ID của phòng muốn tham gia
}
```

**Response:** `MSG_JOIN_ROOM` (0x13) - Sử dụng cùng message type

```javascript
{
  status: uint8,          // STATUS_SUCCESS (0x00) hoặc STATUS_ERROR (0x01)
  room_id: int32,         // ID của phòng (hoặc -1 nếu thất bại)
  message: string         // Thông báo (max 128 ký tự)
}
```

### 3. LEAVE_ROOM Request

**Message Type:** `MSG_LEAVE_ROOM` (0x14)

```javascript
{
  room_id: int32          // ID của phòng muốn rời
}
```

**Response:** `MSG_LEAVE_ROOM` (0x14) - Sử dụng cùng message type

```javascript
{
  status: uint8,          // STATUS_SUCCESS (0x00) hoặc STATUS_ERROR (0x01)
  message: string         // Thông báo (max 128 ký tự)
}
```

### 4. ROOM_LIST_REQUEST

**Message Type:** `MSG_ROOM_LIST_REQUEST` (0x10)

**Request:** Không có payload (chỉ gửi message type và length = 0)

**Response:** `MSG_ROOM_LIST_RESPONSE` (0x11)

```javascript
{
  room_count: uint16,     // Số lượng phòng
  rooms: [                // Mảng thông tin phòng
    {
      room_id: int32,
      room_name: string,   // max 32 ký tự
      player_count: uint8,
      max_players: uint8,
      state: uint8,        // 0=WAITING, 1=PLAYING, 2=FINISHED
      owner_id: int32
    },
    ...
  ]
}
```

### 5. ROOM_UPDATE (Broadcast)

**Message Type:** `MSG_ROOM_UPDATE` (0x15)

Server tự động gửi khi có thay đổi thông tin phòng (không phải response của request).

```javascript
{
  room_id: int32,
  room_name: string,      // max 32 ký tự
  player_count: uint8,
  max_players: uint8,
  state: uint8,           // 0=WAITING, 1=PLAYING, 2=FINISHED
  owner_id: int32
}
```

### 6. ROOM_PLAYERS_UPDATE (Broadcast)

**Message Type:** `MSG_ROOM_PLAYERS_UPDATE` (0x17)

Server tự động gửi đến tất cả người chơi trong phòng khi có người join/leave.

```javascript
{
  room_id: int32,
  room_name: string,      // max 32 ký tự
  max_players: uint8,
  state: uint8,           // 0=WAITING, 1=PLAYING, 2=FINISHED
  owner_id: int32,
  action: uint8,          // 0 = JOIN, 1 = LEAVE
  changed_user_id: int32, // User ID của người join/leave
  changed_username: string, // Username của người join/leave (max 32 ký tự)
  player_count: uint16,   // Số lượng người chơi hiện tại
  players: [              // Danh sách đầy đủ người chơi
    {
      user_id: int32,
      username: string,   // max 32 ký tự
      is_owner: uint8     // 1 nếu là owner, 0 nếu không
    },
    ...
  ]
}
```

---

## Constants

### Giới Hạn
- `MAX_PLAYERS_PER_ROOM`: 10 (số người chơi tối đa trong một phòng)
- `MIN_PLAYERS_PER_ROOM`: 2 (số người chơi tối thiểu để bắt đầu game)
- `ROOM_NAME_MAX_LENGTH`: 32 (độ dài tối đa tên phòng)
- `MAX_ROUNDS`: 10 (số round tối đa trong game)
- `MAX_ROOMS`: 50 (số phòng tối đa trên server)
- `MAX_USERNAME_LEN`: 32 (độ dài tối đa username)
- `MAX_ROOM_NAME_LEN`: 32 (độ dài tối đa tên phòng)

### Room States
```javascript
const ROOM_STATE_WAITING = 0;
const ROOM_STATE_PLAYING = 1;
const ROOM_STATE_FINISHED = 2;
```

### Client States
```javascript
const CLIENT_STATE_LOGGED_OUT = 0;
const CLIENT_STATE_LOGGED_IN = 1;
const CLIENT_STATE_IN_ROOM = 2;
const CLIENT_STATE_IN_GAME = 3;
```

---

## Status Codes

| Code | Giá Trị | Mô Tả |
|------|---------|-------|
| `STATUS_SUCCESS` | 0x00 | Thành công |
| `STATUS_ERROR` | 0x01 | Lỗi chung |
| `STATUS_INVALID_USERNAME` | 0x02 | Username không hợp lệ |
| `STATUS_INVALID_PASSWORD` | 0x03 | Password không hợp lệ |
| `STATUS_USER_EXISTS` | 0x04 | User đã tồn tại |
| `STATUS_AUTH_FAILED` | 0x05 | Xác thực thất bại |

---

## Các Chức Năng

### 1. Lấy Danh Sách Phòng (Get Room List)

**Flow:**
1. Client gửi `MSG_ROOM_LIST_REQUEST` (không có payload)
2. Server kiểm tra client đã đăng nhập chưa
3. Server gửi `MSG_ROOM_LIST_RESPONSE` với danh sách phòng

**Yêu Cầu:**
- Client phải đã đăng nhập (`CLIENT_STATE_LOGGED_IN` trở lên)

**Response:**
- `MSG_ROOM_LIST_RESPONSE` chứa danh sách tất cả phòng trên server

### 2. Tạo Phòng (Create Room)

**Flow:**
1. Client gửi `MSG_CREATE_ROOM` với thông tin phòng
2. Server validate:
   - Client đã đăng nhập
   - Client chưa trong phòng nào
   - Tên phòng không rỗng
   - `max_players` từ 2-10
   - `rounds` từ 1-10
   - Server chưa đầy phòng
3. Server tạo phòng và thêm owner vào phòng
4. Server cập nhật client state thành `CLIENT_STATE_IN_ROOM`
5. Server gửi `MSG_CREATE_ROOM` response

**Yêu Cầu:**
- Client phải đã đăng nhập
- Client không được đang trong phòng khác

**Validation:**
- `room_name`: Không được rỗng, max 32 ký tự
- `max_players`: 2-10
- `rounds`: 1-10

**Response:**
- `status`: `STATUS_SUCCESS` hoặc `STATUS_ERROR`
- `room_id`: ID phòng mới tạo (hoặc -1 nếu lỗi)
- `message`: Thông báo lỗi hoặc thành công

**Lỗi Có Thể Xảy Ra:**
- "Bạn cần đăng nhập để tạo phòng"
- "Bạn đang trong phòng khác"
- "Tên phòng không được để trống"
- "Số người chơi phải từ 2-10"
- "Số round phải từ 1-10"
- "Server đã đầy phòng"
- "Không thể tạo phòng"

### 3. Tham Gia Phòng (Join Room)

**Flow:**
1. Client gửi `MSG_JOIN_ROOM` với `room_id`
2. Server validate:
   - Client đã đăng nhập
   - Client chưa trong phòng nào
   - Phòng tồn tại
   - Phòng chưa đầy
   - Client chưa trong phòng này
3. Server thêm client vào phòng
4. Server cập nhật client state thành `CLIENT_STATE_IN_ROOM`
5. Server gửi `MSG_JOIN_ROOM` response
6. Server broadcast `MSG_ROOM_PLAYERS_UPDATE` đến tất cả người chơi trong phòng

**Yêu Cầu:**
- Client phải đã đăng nhập
- Client không được đang trong phòng khác

**Response:**
- `status`: `STATUS_SUCCESS` hoặc `STATUS_ERROR`
- `room_id`: ID phòng (hoặc -1 nếu lỗi)
- `message`: Thông báo lỗi hoặc thành công

**Lỗi Có Thể Xảy Ra:**
- "Bạn cần đăng nhập để tham gia phòng"
- "Bạn đang trong phòng khác"
- "Không tìm thấy phòng"
- "Phòng đã đầy"
- "Bạn đã trong phòng này"
- "Không thể tham gia phòng"

**Lưu Ý:**
- Nếu phòng đang chơi (`ROOM_PLAYING`), người chơi mới sẽ được đánh dấu là inactive và sẽ chơi từ round tiếp theo

### 4. Rời Phòng (Leave Room)

**Flow:**
1. Client gửi `MSG_LEAVE_ROOM` với `room_id`
2. Server validate:
   - Client đã đăng nhập
   - Client đang trong phòng
   - Phòng tồn tại
   - Client có trong phòng này
3. Server xóa client khỏi phòng
4. Nếu phòng trống sau khi rời, server xóa phòng
5. Nếu không trống:
   - Nếu client là owner, chuyển quyền owner cho người chơi đầu tiên
   - Server broadcast `MSG_ROOM_PLAYERS_UPDATE` đến các người chơi còn lại
6. Server cập nhật client state thành `CLIENT_STATE_LOGGED_IN`
7. Server gửi `MSG_LEAVE_ROOM` response

**Yêu Cầu:**
- Client phải đã đăng nhập
- Client phải đang trong phòng (`CLIENT_STATE_IN_ROOM` hoặc `CLIENT_STATE_IN_GAME`)

**Response:**
- `status`: `STATUS_SUCCESS` hoặc `STATUS_ERROR`
- `message`: Thông báo lỗi hoặc thành công

**Lỗi Có Thể Xảy Ra:**
- "Bạn chưa đăng nhập"
- "Bạn không trong phòng nào"
- "Không tìm thấy phòng"
- "Bạn không trong phòng này"
- "Không thể rời phòng"

**Lưu Ý:**
- Nếu phòng trống sau khi rời, phòng sẽ bị xóa tự động
- Nếu owner rời phòng, quyền owner sẽ được chuyển cho người chơi đầu tiên

### 5. Cập Nhật Thông Tin Phòng (Room Update - Broadcast)

Server tự động gửi `MSG_ROOM_UPDATE` khi có thay đổi thông tin phòng (không phải response của request cụ thể).

**Khi Nào Nhận Được:**
- Khi có thay đổi về trạng thái phòng
- Khi có thay đổi về số lượng người chơi
- Khi có thay đổi về owner

### 6. Cập Nhật Danh Sách Người Chơi (Room Players Update - Broadcast)

Server tự động gửi `MSG_ROOM_PLAYERS_UPDATE` đến tất cả người chơi trong phòng khi:
- Có người mới tham gia phòng (`action = 0`)
- Có người rời phòng (`action = 1`)

**Thông Tin Trong Message:**
- Thông tin đầy đủ về phòng (room_id, room_name, max_players, state, owner_id)
- Thông tin về thay đổi (action, changed_user_id, changed_username)
- Danh sách đầy đủ tất cả người chơi hiện tại trong phòng

**Lưu Ý:**
- Message này chứa danh sách đầy đủ người chơi, không chỉ người thay đổi
- Frontend nên cập nhật toàn bộ danh sách người chơi khi nhận được message này

---

## Message Format

### Cấu Trúc Message Tổng Quát

Tất cả messages đều tuân theo format:

```
[TYPE: 1 byte][LENGTH: 2 bytes (network byte order)][PAYLOAD: variable]
```

- **TYPE**: 1 byte - Loại message
- **LENGTH**: 2 bytes - Độ dài payload (big-endian/network byte order)
- **PAYLOAD**: Variable - Dữ liệu payload

### Byte Order

- Tất cả số nguyên đa byte (int32, uint16, etc.) đều sử dụng **network byte order (big-endian)**
- Frontend cần convert khi gửi/nhận:
  - **Gửi**: Convert từ host byte order sang network byte order
  - **Nhận**: Convert từ network byte order sang host byte order

### Ví Dụ Parse Message

```javascript
// Giả sử nhận được buffer từ socket
function parseMessage(buffer) {
  const type = buffer[0];
  const length = (buffer[1] << 8) | buffer[2]; // Big-endian
  const payload = buffer.slice(3, 3 + length);
  
  return { type, length, payload };
}

// Parse số int32 từ network byte order
function parseInt32(buffer, offset) {
  return (buffer[offset] << 24) | 
         (buffer[offset + 1] << 16) | 
         (buffer[offset + 2] << 8) | 
         buffer[offset + 3];
}

// Tạo số int32 sang network byte order
function createInt32(value) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, value, false); // false = big-endian
  return new Uint8Array(buffer);
}
```

---

## Ví Dụ Implementation

### 1. Gửi CREATE_ROOM Request

```javascript
function createRoom(roomName, maxPlayers, rounds) {
  // Tạo payload
  const roomNameBuffer = new TextEncoder().encode(roomName);
  const payload = new Uint8Array(32 + 1 + 1); // room_name(32) + max_players(1) + rounds(1)
  
  // Copy room_name (đảm bảo null-terminated)
  payload.set(roomNameBuffer.slice(0, 31), 0);
  payload[31] = 0; // Null terminator
  
  payload[32] = maxPlayers;
  payload[33] = rounds;
  
  // Tạo message
  const message = new Uint8Array(3 + payload.length);
  message[0] = 0x12; // MSG_CREATE_ROOM
  message[1] = (payload.length >> 8) & 0xFF; // High byte
  message[2] = payload.length & 0xFF; // Low byte
  message.set(payload, 3);
  
  // Gửi qua socket
  socket.send(message);
}
```

### 2. Nhận CREATE_ROOM Response

```javascript
function handleCreateRoomResponse(buffer) {
  const status = buffer[0];
  const roomId = parseInt32(buffer, 1); // Parse int32 từ offset 1
  const message = new TextDecoder().decode(buffer.slice(5, 5 + 128)).replace(/\0/g, '');
  
  if (status === 0x00) { // STATUS_SUCCESS
    console.log(`Tạo phòng thành công! Room ID: ${roomId}`);
    // Cập nhật UI, chuyển vào phòng, etc.
  } else {
    console.error(`Lỗi: ${message}`);
  }
}
```

### 3. Gửi JOIN_ROOM Request

```javascript
function joinRoom(roomId) {
  const payload = new Uint8Array(4); // int32 = 4 bytes
  const roomIdBuffer = createInt32(roomId);
  payload.set(roomIdBuffer, 0);
  
  const message = new Uint8Array(3 + payload.length);
  message[0] = 0x13; // MSG_JOIN_ROOM
  message[1] = (payload.length >> 8) & 0xFF;
  message[2] = payload.length & 0xFF;
  message.set(payload, 3);
  
  socket.send(message);
}
```

### 4. Nhận ROOM_LIST_RESPONSE

```javascript
function handleRoomListResponse(buffer) {
  let offset = 0;
  
  // Đọc room_count (uint16)
  const roomCount = (buffer[offset] << 8) | buffer[offset + 1];
  offset += 2;
  
  const rooms = [];
  
  for (let i = 0; i < roomCount; i++) {
    const room = {
      room_id: parseInt32(buffer, offset),
      room_name: new TextDecoder().decode(buffer.slice(offset + 4, offset + 36)).replace(/\0/g, ''),
      player_count: buffer[offset + 36],
      max_players: buffer[offset + 37],
      state: buffer[offset + 38],
      owner_id: parseInt32(buffer, offset + 39)
    };
    
    rooms.push(room);
    offset += 43; // 4 + 32 + 1 + 1 + 1 + 4 = 43 bytes
  }
  
  // Cập nhật UI với danh sách phòng
  updateRoomList(rooms);
}
```

### 5. Nhận ROOM_PLAYERS_UPDATE (Broadcast)

```javascript
function handleRoomPlayersUpdate(buffer) {
  let offset = 0;
  
  const update = {
    room_id: parseInt32(buffer, offset),
    room_name: new TextDecoder().decode(buffer.slice(offset + 4, offset + 36)).replace(/\0/g, ''),
    max_players: buffer[offset + 36],
    state: buffer[offset + 37],
    owner_id: parseInt32(buffer, offset + 38),
    action: buffer[offset + 42], // 0 = JOIN, 1 = LEAVE
    changed_user_id: parseInt32(buffer, offset + 43),
    changed_username: new TextDecoder().decode(buffer.slice(offset + 47, offset + 79)).replace(/\0/g, ''),
    player_count: (buffer[offset + 79] << 8) | buffer[offset + 80]
  };
  
  offset = 81; // Bắt đầu đọc danh sách players
  
  const players = [];
  for (let i = 0; i < update.player_count; i++) {
    const player = {
      user_id: parseInt32(buffer, offset),
      username: new TextDecoder().decode(buffer.slice(offset + 4, offset + 36)).replace(/\0/g, ''),
      is_owner: buffer[offset + 36]
    };
    players.push(player);
    offset += 37; // 4 + 32 + 1 = 37 bytes
  }
  
  // Cập nhật UI với thông tin phòng và danh sách người chơi
  updateRoomInfo(update);
  updatePlayerList(players);
  
  // Hiển thị thông báo join/leave
  if (update.action === 0) {
    console.log(`${update.changed_username} đã tham gia phòng`);
  } else {
    console.log(`${update.changed_username} đã rời phòng`);
  }
}
```

### 6. Helper Functions

```javascript
// Parse int32 từ network byte order
function parseInt32(buffer, offset) {
  return (buffer[offset] << 24) | 
         (buffer[offset + 1] << 16) | 
         (buffer[offset + 2] << 8) | 
         buffer[offset + 3];
}

// Tạo int32 sang network byte order
function createInt32(value) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, value, false); // false = big-endian
  return new Uint8Array(buffer);
}

// Tạo uint16 sang network byte order
function createUint16(value) {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, value, false); // false = big-endian
  return new Uint8Array(buffer);
}
```

---

## Lưu Ý Quan Trọng

1. **Byte Order**: Tất cả số nguyên đa byte phải sử dụng network byte order (big-endian)

2. **String Encoding**: 
   - Sử dụng UTF-8 encoding
   - Đảm bảo null-terminated (kết thúc bằng `\0`)
   - Khi parse, loại bỏ các ký tự null thừa

3. **Message Handling**:
   - Luôn kiểm tra `status` trong response trước khi xử lý
   - Xử lý các lỗi có thể xảy ra
   - Cập nhật UI khi nhận được broadcast messages

4. **State Management**:
   - Theo dõi trạng thái client (`CLIENT_STATE_IN_ROOM`, etc.)
   - Không cho phép tạo/tham gia phòng nếu đã trong phòng khác
   - Cập nhật state khi nhận response thành công

5. **Broadcast Messages**:
   - `MSG_ROOM_UPDATE` và `MSG_ROOM_PLAYERS_UPDATE` là broadcast, không phải response
   - Luôn lắng nghe và xử lý các broadcast messages
   - Cập nhật UI real-time khi nhận broadcast

6. **Error Handling**:
   - Hiển thị thông báo lỗi từ server cho người dùng
   - Xử lý các trường hợp lỗi network
   - Validate input trước khi gửi request

---

## Tóm Tắt Flow

### Flow Tạo Phòng
```
Client → MSG_CREATE_ROOM → Server
Server → MSG_CREATE_ROOM (response) → Client
```

### Flow Tham Gia Phòng
```
Client → MSG_JOIN_ROOM → Server
Server → MSG_JOIN_ROOM (response) → Client
Server → MSG_ROOM_PLAYERS_UPDATE (broadcast) → Tất cả clients trong phòng
```

### Flow Rời Phòng
```
Client → MSG_LEAVE_ROOM → Server
Server → MSG_LEAVE_ROOM (response) → Client
Server → MSG_ROOM_PLAYERS_UPDATE (broadcast) → Các clients còn lại trong phòng
```

### Flow Lấy Danh Sách Phòng
```
Client → MSG_ROOM_LIST_REQUEST → Server
Server → MSG_ROOM_LIST_RESPONSE → Client
```

---

## Kết Luận

Tài liệu này cung cấp đầy đủ thông tin để Frontend có thể triển khai client cho chức năng Room. Nếu có thắc mắc hoặc cần làm rõ thêm, vui lòng tham khảo source code trong:
- `src/server/protocol_room.c` - Xử lý protocol room
- `src/server/room.c` - Logic quản lý phòng
- `src/include/room.h` - Định nghĩa cấu trúc room
- `src/common/protocol.h` - Định nghĩa message types và structures

