#include "../include/database.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

db_connection_t* db_connect(const char* host, const char* user, 
                           const char* password, const char* database) {
    // Cấp phát bộ nhớ cho connection
    db_connection_t* db = (db_connection_t*)malloc(sizeof(db_connection_t));
    if (!db) {
        fprintf(stderr, "Lỗi: Không thể cấp phát bộ nhớ cho database connection\n");
        return NULL;
    }
    
    // Khởi tạo MySQL connection
    db->conn = mysql_init(NULL);
    if (!db->conn) {
        fprintf(stderr, "Lỗi: Không thể khởi tạo MySQL connection\n");
        free(db);
        return NULL;
    }
    
    // Lưu thông tin kết nối
    strncpy(db->host, host, sizeof(db->host) - 1);
    db->host[sizeof(db->host) - 1] = '\0';
    
    strncpy(db->user, user, sizeof(db->user) - 1);
    db->user[sizeof(db->user) - 1] = '\0';
    
    strncpy(db->password, password, sizeof(db->password) - 1);
    db->password[sizeof(db->password) - 1] = '\0';
    
    strncpy(db->database, database, sizeof(db->database) - 1);
    db->database[sizeof(db->database) - 1] = '\0';
    
    // Kết nối đến MySQL server (port 3308 từ docker-compose mapping)
    if (!mysql_real_connect(db->conn, db->host, db->user, db->password, 
                           db->database, 3308, NULL, 0)) {
        fprintf(stderr, "Lỗi kết nối MySQL: %s\n", mysql_error(db->conn));
        mysql_close(db->conn);
        free(db);
        return NULL;
    }
    
    // Set charset utf8mb4
    if (mysql_set_character_set(db->conn, "utf8mb4")) {
        fprintf(stderr, "Cảnh báo: Không thể set charset utf8mb4: %s\n", 
                mysql_error(db->conn));
        // Không return NULL vì kết nối vẫn có thể hoạt động
    }
    
    printf("Đã kết nối thành công đến MySQL database: %s\n", db->database);
    
    return db;
}

void db_disconnect(db_connection_t* db) {
    if (!db) {
        return;
    }
    
    if (db->conn) {
        mysql_close(db->conn);
        db->conn = NULL;
    }
    
    free(db);
    printf("Đã đóng kết nối database\n");
}

MYSQL_RES* db_execute_query(db_connection_t* db, const char* query, ...) {
    if (!db || !db->conn || !query) {
        fprintf(stderr, "Lỗi: Tham số không hợp lệ\n");
        return NULL;
    }
    
    // Đếm số lượng placeholders (?) trong query
    int param_count = 0;
    const char* p = query;
    while (*p) {
        if (*p == '?') {
            param_count++;
        }
        p++;
    }
    
    // Nếu không có placeholder, thực thi query trực tiếp
    if (param_count == 0) {
        if (mysql_query(db->conn, query)) {
            fprintf(stderr, "Lỗi query: %s\n", mysql_error(db->conn));
            return NULL;
        }
        return mysql_store_result(db->conn);
    }
    
    // Sử dụng prepared statement cho queries có parameters
    MYSQL_STMT* stmt = mysql_stmt_init(db->conn);
    if (!stmt) {
        fprintf(stderr, "Lỗi: Không thể khởi tạo prepared statement\n");
        return NULL;
    }
    
    // Prepare statement
    if (mysql_stmt_prepare(stmt, query, strlen(query))) {
        fprintf(stderr, "Lỗi prepare statement: %s\n", mysql_stmt_error(stmt));
        mysql_stmt_close(stmt);
        return NULL;
    }
    
    // Cấp phát bộ nhớ cho bind parameters
    MYSQL_BIND* bind = (MYSQL_BIND*)calloc(param_count, sizeof(MYSQL_BIND));
    if (!bind) {
        fprintf(stderr, "Lỗi: Không thể cấp phát bộ nhớ cho bind parameters\n");
        mysql_stmt_close(stmt);
        return NULL;
    }
    
    // Mảng lưu trữ dữ liệu và độ dài cho mỗi parameter
    char** param_data = (char**)malloc(param_count * sizeof(char*));
    unsigned long* param_lengths = (unsigned long*)malloc(param_count * sizeof(unsigned long));
    
    if (!param_data || !param_lengths) {
        fprintf(stderr, "Lỗi: Không thể cấp phát bộ nhớ\n");
        free(bind);
        if (param_data) free(param_data);
        if (param_lengths) free(param_lengths);
        mysql_stmt_close(stmt);
        return NULL;
    }
    
    // Lấy các tham số từ variadic arguments
    va_list args;
    va_start(args, query);
    
    for (int i = 0; i < param_count; i++) {
        const char* param_value = va_arg(args, const char*);
        if (!param_value) {
            param_value = ""; // Xử lý NULL như empty string
        }
        
        // Cấp phát và copy giá trị
        param_data[i] = (char*)malloc(strlen(param_value) + 1);
        if (!param_data[i]) {
            fprintf(stderr, "Lỗi: Không thể cấp phát bộ nhớ cho parameter %d\n", i);
            // Cleanup
            for (int j = 0; j < i; j++) {
                free(param_data[j]);
            }
            free(bind);
            free(param_data);
            free(param_lengths);
            va_end(args);
            mysql_stmt_close(stmt);
            return NULL;
        }
        
        strcpy(param_data[i], param_value);
        param_lengths[i] = strlen(param_value);
        
        // Setup bind structure
        bind[i].buffer_type = MYSQL_TYPE_STRING;
        bind[i].buffer = param_data[i];
        bind[i].buffer_length = param_lengths[i] + 1;
        bind[i].length = &param_lengths[i];
        bind[i].is_null = 0;
    }
    
    va_end(args);
    
    // Bind parameters
    if (mysql_stmt_bind_param(stmt, bind)) {
        fprintf(stderr, "Lỗi bind parameters: %s\n", mysql_stmt_error(stmt));
        // Cleanup
        for (int i = 0; i < param_count; i++) {
            free(param_data[i]);
        }
        free(bind);
        free(param_data);
        free(param_lengths);
        mysql_stmt_close(stmt);
        return NULL;
    }
    
    // Execute statement
    if (mysql_stmt_execute(stmt)) {
        fprintf(stderr, "Lỗi execute statement: %s\n", mysql_stmt_error(stmt));
        // Cleanup
        for (int i = 0; i < param_count; i++) {
            free(param_data[i]);
        }
        free(bind);
        free(param_data);
        free(param_lengths);
        mysql_stmt_close(stmt);
        return NULL;
    }
    
    // Lấy kết quả
    MYSQL_RES* result = mysql_stmt_result_metadata(stmt);
    if (result) {
        // Store result để có thể sử dụng sau khi đóng statement
        if (mysql_stmt_store_result(stmt)) {
            fprintf(stderr, "Lỗi store result: %s\n", mysql_stmt_error(stmt));
            mysql_free_result(result);
            result = NULL;
        }
    } else {
        // Không có result set (INSERT, UPDATE, DELETE)
        // Kiểm tra xem có lỗi không
        if (mysql_stmt_errno(stmt)) {
            fprintf(stderr, "Lỗi: %s\n", mysql_stmt_error(stmt));
        }
    }
    
    // Cleanup
    for (int i = 0; i < param_count; i++) {
        free(param_data[i]);
    }
    free(bind);
    free(param_data);
    free(param_lengths);
    mysql_stmt_close(stmt);
    
    return result;
}

