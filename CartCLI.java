import java.sql.*;
import java.math.BigDecimal;
import java.util.Scanner;

public class CartCLI {

    // --- Connection settings (yours) ---
    static final String DB_URL = "jdbc:mysql://127.0.0.1:3306/ecopro?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    static final String USER   = "root";
    static final String PASS   = "RootPass123!";

    public static void main(String[] args) {
        System.out.println("JDBC is being connected with MySQL...");

        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASS)) {
            System.out.println("✅ Connected!");

            ensureTableExists(conn); // make sure table is there once

            // simple menu loop
            Scanner sc = new Scanner(System.in);
            int choice = -1;
            while (choice != 0) {
                System.out.println("\n=== EcoPro Cart – CLI ===");
                System.out.println("1) Show cart_items");
                System.out.println("2) Delete last-added item");
                System.out.println("3) Insert a sample item (optional)");
                System.out.println("0) Exit");
                System.out.print("Choose: ");

                String line = sc.nextLine().trim();
                if (line.isEmpty() || !line.chars().allMatch(Character::isDigit)) {
                    System.out.println("⚠️  Enter a number like 1, 2, 3, or 0.");
                    continue;
                }
                choice = Integer.parseInt(line);

                switch (choice) {
                    case 1 -> showCartItems(conn);
                    case 2 -> deleteLastItem(conn);
                    case 3 -> insertSample(conn);
                    case 0 -> System.out.println("Bye! 👋");
                    default -> System.out.println("⚠️  Unknown option.");
                }
            }
        } catch (SQLException e) {
            System.out.println("❌ Database error:");
            e.printStackTrace();
        }
    }

    // Ensure table exists (runs once)
    private static void ensureTableExists(Connection conn) throws SQLException {
        String ddl = """
            CREATE TABLE IF NOT EXISTS cart_items (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            product_id VARCHAR(50),
            name       VARCHAR(255),
            price      DECIMAL(10,2),
            image      VARCHAR(255),
            qty        INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """;
        try (Statement st = conn.createStatement()) {
            st.executeUpdate(ddl);
        }
    }
