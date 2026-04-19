package com.nischal.backend.config;

import com.nischal.backend.entity.Category;
import com.nischal.backend.entity.Ingredient;
import com.nischal.backend.entity.RestaurantTable;
import com.nischal.backend.entity.Reward;
import com.nischal.backend.entity.Role;
import com.nischal.backend.entity.TableFloor;
import com.nischal.backend.entity.User;
import com.nischal.backend.repository.CategoryRepository;
import com.nischal.backend.repository.IngredientRepository;
import com.nischal.backend.repository.RestaurantTableRepository;
import com.nischal.backend.repository.RewardRepository;
import com.nischal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository         categoryRepository;
    private final IngredientRepository       ingredientRepository;
    private final RewardRepository           rewardRepository;
    private final UserRepository             userRepository;
    private final RestaurantTableRepository  tableRepository;
    private final PasswordEncoder            passwordEncoder;
    private final JdbcTemplate               jdbcTemplate;

    @Override
    public void run(String... args) {
        runSchemaMigrations();
        tableRepository.migrateOldFloorValuesToIndoor();          // GROUND/FIRST/SECOND → INDOOR
        tableRepository.migrateOutOfServiceStatusToMaintenance(); // OUT_OF_SERVICE → MAINTENANCE
        seedDefaultUsers();
        seedCategories();
        seedInventory();
        seedRewards();
        seedTables();
    }

    // Schema migrations — fix leftover columns/values from old schema versions

    private void runSchemaMigrations() {
        // These columns existed in the old table_bookings schema but were removed from the entity.
        // ddl-auto:update never drops columns, so we make them nullable to unblock Hibernate inserts.
        tryAlter("ALTER TABLE table_bookings MODIFY COLUMN customer_name  VARCHAR(255) NULL DEFAULT NULL");
        tryAlter("ALTER TABLE table_bookings MODIFY COLUMN customer_email VARCHAR(255) NULL DEFAULT NULL");
        tryAlter("ALTER TABLE table_bookings MODIFY COLUMN customer_phone VARCHAR(50)  NULL DEFAULT NULL");
        tryAlter("ALTER TABLE table_bookings MODIFY COLUMN guest_count    INT          NULL DEFAULT NULL");
    }

    private void tryAlter(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            // Column may not exist in a clean install — that is fine
            log.debug("Schema migration skipped ({}): {}", e.getMessage(), sql);
        }
    }

    // Default Users

    private void seedDefaultUsers() {
        record DefaultUser(String fullName, String email, String password, Role role) {}
        List<DefaultUser> defaults = List.of(
            new DefaultUser("Admin Owner",  "admin@grabeat.com",  "Admin@123",  Role.OWNER),
            new DefaultUser("Staff Member", "staff@grabeat.com",  "Staff@123",  Role.STAFF),
            new DefaultUser("Test Customer","customer@grabeat.com","Customer@123", Role.CUSTOMER)
        );
        for (DefaultUser u : defaults) {
            if (!userRepository.existsByEmail(u.email())) {
                userRepository.save(User.builder()
                    .fullName(u.fullName())
                    .email(u.email())
                    .password(passwordEncoder.encode(u.password()))
                    .role(u.role())
                    .isActive(true)
                    .isEmailVerified(true)
                    .build());
                log.info("DataSeeder: created default user {} ({})", u.email(), u.role());
            }
        }
    }

    // Tables

    private void seedTables() {
        if (tableRepository.count() > 0) return; // skip if already seeded

        record Tbl(String number, int capacity, TableFloor floor, String desc) {}
        List<Tbl> tables = List.of(
            new Tbl("T-01", 2,  TableFloor.INDOOR,         "Window seat with garden view"),
            new Tbl("T-02", 4,  TableFloor.INDOOR,         "Corner table, quiet area"),
            new Tbl("T-03", 4,  TableFloor.INDOOR,         "Central location"),
            new Tbl("T-04", 6,  TableFloor.INDOOR,         "Large family table"),
            new Tbl("T-05", 2,  TableFloor.OUTDOOR,        "Patio table, city view"),
            new Tbl("T-06", 4,  TableFloor.OUTDOOR,        "Garden terrace seating"),
            new Tbl("T-07", 4,  TableFloor.ROOFTOP,        "Rooftop with panoramic view"),
            new Tbl("T-08", 2,  TableFloor.ROOFTOP,        "Cozy rooftop corner"),
            new Tbl("T-09", 8,  TableFloor.PRIVATE_DINING, "Private room for events"),
            new Tbl("T-10", 4,  TableFloor.TERRACE,        "Terrace with natural light")
        );

        int created = 0;
        for (Tbl t : tables) {
            if (!tableRepository.existsByTableNumber(t.number())) {
                tableRepository.save(RestaurantTable.builder()
                    .tableNumber(t.number())
                    .capacity(t.capacity())
                    .floor(t.floor())
                    .description(t.desc())
                    .build());
                created++;
            }
        }
        if (created > 0) log.info("DataSeeder: created {} restaurant tables.", created);
    }

    // Categories

    private void seedCategories() {
        record Seed(String name, String description, int order) {}
        List<Seed> defaults = List.of(
            new Seed("Rice & Noodles",  "Steamed rice, fried rice, noodle dishes and congee",  1),
            new Seed("Meat & Grill",    "Grilled, roasted and pan-fried meat dishes",           2),
            new Seed("Poultry",         "Chicken, duck and other poultry preparations",         3),
            new Seed("Seafood",         "Fresh fish, prawns, squid and shellfish",              4),
            new Seed("Vegetarian",      "Plant-based and vegetable dishes",                     5),
            new Seed("Soups & Broths",  "Clear broths, hearty soups and hot-pots",             6),
            new Seed("Beverages",       "Hot and cold drinks, juices, tea and coffee",          7),
            new Seed("Water & Juices",  "Still water, sparkling water, fresh-pressed juices",  8),
            new Seed("Desserts",        "Sweet treats, cakes, ice cream and puddings",          9),
            new Seed("Snacks & Sides",  "Appetisers, finger food and side dishes",             10),
            new Seed("Set Meals",       "Value combo meals served with rice or noodles",       11)
        );
        int created = 0;
        for (Seed s : defaults) {
            if (!categoryRepository.existsByName(s.name())) {
                categoryRepository.save(Category.builder()
                    .name(s.name()).description(s.description())
                    .sortOrder(s.order()).isActive(true).build());
                created++;
            }
        }
        if (created > 0) log.info("DataSeeder: created {} menu categories.", created);
    }

    // Inventory

    private void seedInventory() {
        record Inv(String name, String unit, double stock, double minLevel, double cost, String desc) {}

        // stock < minLevel  →  triggers low-stock alert in the dashboard
        List<Inv> items = List.of(
            // Normal stock
            new Inv("Basmati Rice",        "kg",  50.0,  10.0,  120.0, "Long-grain basmati rice for fried rice and biryani"),
            new Inv("Chicken Breast",      "kg",  30.0,   5.0,  480.0, "Boneless skinless chicken breast"),
            new Inv("Onions",              "kg",  25.0,   5.0,   40.0, "White onions for base gravies"),
            new Inv("Garlic",              "kg",  10.0,   2.0,   90.0, "Fresh garlic cloves"),
            new Inv("Ginger",              "kg",   8.0,   2.0,  100.0, "Fresh ginger root"),
            new Inv("Cooking Oil",         "L",   20.0,   5.0,  180.0, "Refined sunflower oil"),
            new Inv("Tomatoes",            "kg",  15.0,   4.0,   50.0, "Fresh ripe tomatoes"),
            new Inv("Bell Peppers",        "kg",  12.0,   3.0,   80.0, "Mixed red and green bell peppers"),
            new Inv("Egg",                 "pcs", 120.0, 24.0,   15.0, "Fresh farm eggs"),
            new Inv("Flour",               "kg",  40.0,   8.0,   60.0, "All-purpose wheat flour"),
            new Inv("Sugar",               "kg",  20.0,   5.0,   70.0, "White granulated sugar"),
            new Inv("Salt",                "kg",  10.0,   2.0,   30.0, "Iodized table salt"),
            new Inv("Black Pepper",        "kg",   5.0,   1.0,  350.0, "Freshly ground black pepper"),
            new Inv("Turmeric Powder",     "kg",   3.0,   0.5,  200.0, "Ground turmeric"),
            new Inv("Cumin Seeds",         "kg",   4.0,   0.5,  280.0, "Whole cumin seeds"),
            new Inv("Coriander Powder",    "kg",   3.5,   1.0,  220.0, "Ground coriander"),
            new Inv("Milk",                "L",   15.0,   4.0,   80.0, "Full-fat fresh milk"),
            new Inv("Butter",              "kg",   6.0,   2.0,  500.0, "Unsalted butter"),
            new Inv("Lemon",               "pcs",  40.0,  10.0,   10.0, "Fresh lemons"),
            new Inv("Green Chilli",        "kg",   5.0,   1.0,  120.0, "Fresh green chillies"),

            // LOW STOCK — stock intentionally below minLevel
            new Inv("Saffron",             "g",    2.0,  10.0, 1200.0, "Premium saffron threads — REORDER NEEDED"),
            new Inv("Prawns",              "kg",   1.5,   5.0,  900.0, "Fresh tiger prawns — REORDER NEEDED"),
            new Inv("Heavy Cream",         "L",    0.8,   3.0,  320.0, "Whipping cream for sauces and desserts — REORDER NEEDED"),
            new Inv("Paneer",              "kg",   0.5,   4.0,  450.0, "Fresh cottage cheese — REORDER NEEDED"),
            new Inv("Cardamom",            "kg",   0.2,   1.0,  800.0, "Green cardamom pods — REORDER NEEDED")
        );

        int created = 0;
        for (Inv i : items) {
            if (!ingredientRepository.existsByNameIgnoreCase(i.name())) {
                ingredientRepository.save(Ingredient.builder()
                    .name(i.name())
                    .unit(i.unit())
                    .currentStock(BigDecimal.valueOf(i.stock()))
                    .minStockLevel(BigDecimal.valueOf(i.minLevel()))
                    .costPerUnit(BigDecimal.valueOf(i.cost()))
                    .description(i.desc())
                    .isActive(true)
                    .build());
                created++;
            }
        }
        if (created > 0) log.info("DataSeeder: created {} inventory ingredients ({} low-stock).", created, 5);
    }

    // Loyalty Rewards

    private void seedRewards() {
        record Rew(String name, String desc, int pts, double discount) {}

        List<Rew> rewards = List.of(
            new Rew("Welcome Drink",
                "Complimentary house drink on your next visit",
                80,  120.0),
            new Rew("Free Dessert",
                "Any dessert from our menu — on the house",
                150, 200.0),
            new Rew("10% Bill Discount",
                "10% off your total bill for any dine-in order",
                250, 350.0),
            new Rew("Free Starter",
                "Choose any starter from our Snacks & Sides menu",
                200, 280.0),
            new Rew("Birthday Special",
                "Complimentary main course on your birthday month",
                400, 600.0),
            new Rew("VIP Table Upgrade",
                "Priority seating at our premium Private Dining section",
                600, 900.0),
            new Rew("Family Feast Voucher",
                "NPR 1500 off on orders above NPR 5000 for groups of 4+",
                1000, 1500.0),
            new Rew("Chef Special Platter",
                "Exclusive chef's tasting menu for two — seasonal items",
                800, 1200.0)
        );

        int created = 0;
        for (Rew r : rewards) {
            boolean exists = rewardRepository.findAll().stream()
                .anyMatch(existing -> existing.getName().equalsIgnoreCase(r.name()));
            if (!exists) {
                rewardRepository.save(Reward.builder()
                    .name(r.name())
                    .description(r.desc())
                    .pointsCost(r.pts())
                    .discountAmount(BigDecimal.valueOf(r.discount()))
                    .isActive(true)
                    .build());
                created++;
            }
        }
        if (created > 0) log.info("DataSeeder: created {} loyalty rewards.", created);
    }
}
