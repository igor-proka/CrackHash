package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * Тело клиентского POST /api/hash/crack.
 * Клиент передает MD5-хэш и максимальную длину слова для перебора.
 */
@Data
public class CrackRequest {
    @NotBlank
    @Pattern(regexp = "^[a-fA-F0-9]{32}$")
    private String hash;

    @Min(1)
    @Max(6)
    private int maxLength;
}
