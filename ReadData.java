import java.sql.*;

public class ReadData {
    static final String DB_URL = "jdbc:mysql://127.0.0.1:3306/ecopro?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    static final String USER   = "root";
    static final String PASS   = "RootPass123!";

    public static void main(String[] args) {
        String sql = "SELECT id, product_id, name, price, qty, created_at FROM cart_items ORDER BY id DESC";
        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASS);
            Statement st = conn.createStatement();
            ResultSet rs = st.executeQuery(sql)) {

            System.out.println("id | product_id | name | price | qty | created_at");
            while (rs.next()) {
                System.out.printf("%d | %s | %s | %s | %d | %s%n",
                    rs.getLong("id"),
                    rs.getString("product_id"),
                    rs.getString("name"),
                    rs.getBigDecimal("price").toPlainString(),
                    rs.getInt("qty"),
                    rs.getTimestamp("created_at").toString()
                );
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
