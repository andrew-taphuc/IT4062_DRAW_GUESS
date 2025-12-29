#include "../include/protocol.h"
#include "../include/server.h"
#include "../include/database.h"
#include "../common/protocol.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <arpa/inet.h>

extern db_connection_t* db;

// GAME_HISTORY_RESPONSE payload:
// count(2) + entries (score(4) + rank(4) + finished_at(32)) * count

int protocol_handle_get_game_history(server_t* server, int client_index, const message_t* msg) {
    (void)msg; // No payload needed, use user_id from client
    
    if (!server || client_index < 0 || client_index >= MAX_CLIENTS) return -1;
    
    client_t* client = &server->clients[client_index];
    if (!client->active || client->user_id <= 0) {
        printf("[HISTORY] Client not authenticated\n");
        return -1;
    }
    
    if (!db) {
        printf("[HISTORY] Database not connected\n");
        return -1;
    }
    
    // Lấy lịch sử từ database
    game_history_entry_t entries[100];
    int count = db_get_game_history(db, client->user_id, entries, 100);
    
    if (count < 0) {
        printf("[HISTORY] Failed to get history for user %d\n", client->user_id);
        count = 0; // Send empty response
    }
    
    printf("[HISTORY] Retrieved %d history entries for user %d\n", count, client->user_id);
    
    // Tạo response payload
    // Format: count(2) + entries (score(4) + rank(4) + finished_at(32)) * count
    uint16_t entry_count = (uint16_t)count;
    size_t payload_size = 2 + (size_t)count * (4 + 4 + 32);
    
    if (payload_size > BUFFER_SIZE - 3) {
        // Quá lớn, cắt bớt
        entry_count = (BUFFER_SIZE - 3 - 2) / (4 + 4 + 32);
        payload_size = 2 + (size_t)entry_count * (4 + 4 + 32);
    }
    
    uint8_t payload[BUFFER_SIZE];
    memset(payload, 0, payload_size);
    
    // Write count
    uint16_t count_be = htons(entry_count);
    memcpy(payload, &count_be, 2);
    
    // Write entries
    uint8_t* p = payload + 2;
    for (int i = 0; i < entry_count; i++) {
        // score (4 bytes, big-endian)
        int32_t score = entries[i].score;
        uint32_t score_be = htonl((uint32_t)score);
        memcpy(p, &score_be, 4);
        p += 4;
        
        // rank (4 bytes, big-endian)
        int32_t rank = entries[i].rank;
        uint32_t rank_be = htonl((uint32_t)rank);
        memcpy(p, &rank_be, 4);
        p += 4;
        
        // finished_at (32 bytes, null-terminated string)
        strncpy((char*)p, entries[i].finished_at, 31);
        ((char*)p)[31] = '\0';
        p += 32;
    }
    
    // Send response
    int client_fd = server->clients[client_index].fd;
    return protocol_send_message(client_fd, MSG_GAME_HISTORY_RESPONSE, payload, (uint16_t)payload_size);
}

