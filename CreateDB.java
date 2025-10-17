import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class CreateDB {

    static final String DB_URL = "jdbc:mysql://localhost:3306/?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    static final String USER = "root"; // default MySQL username
    static final String PASS = "your_password_here"; // your own SQL password

    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
                Statement stmt = conn.createStatement()) {

            String sql = "CREATE DATABASE IF NOT EXISTS ADA";
            stmt.executeUpdate(sql);
            System.out.println("Database created successfully... ✅");

        } catch (SQLException e) {
            System.out.println("Error creating database ❌");
            e.printStackTrace();
        }
    }
}
