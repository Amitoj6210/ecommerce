import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.math.BigDecimal;

public class CreateTable {

    // === Your exact connection details ===
    static final String DB_URL = "jdbc:mysql://127.0.0.1:3306/ecopro?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    static final String USER   = "root";
    static final String PASS   = "RootPass123!";

    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
            Statement stmt = conn.createStatement()) {

            // 1) Create table if missing
            String createTable = """
                CREATE TABLE IF NOT EXISTS cart_items (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    product_id VARCHAR(50),
                    name VARCHAR(255),
                    price DECIMAL(10,2),
                    image VARCHAR(255),
                    qty INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """;
            stmt.executeUpdate(createTable);
            System.out.println("✅ Table 'cart_items' is ready.");

            // 2) Insert one sample row
            String insertSQL = "INSERT INTO cart_items (product_id, name, price, image, qty) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement ps = conn.prepareStatement(insertSQL)) {
                ps.setString(1, "pro1");
                ps.setString(2, "Tropical Vibe Shirt");
                ps.setBigDecimal(3, new BigDecimal("78.00"));
                ps.setString(4, "pro1.png");
                ps.setInt(5, 1);
                int rows = ps.executeUpdate();
                System.out.println("✅ Inserted rows: " + rows);
            }

            // 3) Show count
            String countSQL = "SELECT COUNT(*) FROM cart_items";
            try (Statement s2 = conn.createStatement();
                ResultSet rs = s2.executeQuery(countSQL)) {
                if (rs.next()) {
                    System.out.println("🛒 Total items in cart_items table: " + rs.getInt(1));
                }
            }

            System.out.println("Done.");

        } catch (SQLException e) {
            System.out.println("❌ Database error:");
            e.printStackTrace();
        }
    }
}
