package com.nischal.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Maps a MenuItem to the ingredients it uses (recipe).
 * quantityUsed = how much of the ingredient is consumed per 1 portion of the menu item.
 */
@Entity
@Table(name = "recipe_ingredients",
    uniqueConstraints = @UniqueConstraint(columnNames = {"menu_item_id", "ingredient_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    /** Quantity consumed per 1 serving of the menu item */
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityUsed;
}
