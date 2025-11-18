#ifndef DATABASE_H
#define DATABASE_H

#include <mysql/mysql.h>
#include <stdarg.h>

// Cấu trúc lưu thông tin kết nối database
typedef struct {
    MYSQL* conn;
    char host[64];
    char user[32];
    char password[64];
    char database[32];
} db_connection_t;

/**
 * Kết nối đến MySQL database
 * @param host Địa chỉ host MySQL
 * @param user Tên người dùng
 * @param password Mật khẩu
 * @param database Tên database
 * @return Con trỏ đến db_connection_t nếu thành công, NULL nếu thất bại
 */
db_connection_t* db_connect(const char* host, const char* user, 
                           const char* password, const char* database);

/**
 * Đóng kết nối database và giải phóng tài nguyên
 * @param db Con trỏ đến db_connection_t
 */
void db_disconnect(db_connection_t* db);

/**
 * Thực thi query với prepared statement
 * @param db Con trỏ đến db_connection_t
 * @param query Câu lệnh SQL với placeholders (?)
 * @param ... Các tham số để bind vào placeholders (chỉ hỗ trợ string)
 * @return MYSQL_RES* nếu thành công, NULL nếu thất bại
 * 
 * Ví dụ:
 *   db_execute_query(db, "SELECT * FROM users WHERE username = ?", "john");
 *   db_execute_query(db, "INSERT INTO users (username, password) VALUES (?, ?)", "user1", "pass1");
 */
MYSQL_RES* db_execute_query(db_connection_t* db, const char* query, ...);

#endif // DATABASE_H

