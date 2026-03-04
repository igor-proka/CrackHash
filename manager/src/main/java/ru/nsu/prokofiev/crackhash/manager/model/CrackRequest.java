package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

@Data
public class CrackRequest {
    private String hash;
    private int maxLength;
}
