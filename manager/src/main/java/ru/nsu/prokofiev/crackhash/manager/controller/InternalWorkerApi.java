package ru.nsu.prokofiev.crackhash.manager.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.nsu.prokofiev.crackhash.manager.model.WorkerResponse;
import ru.nsu.prokofiev.crackhash.manager.service.ManagerService;

@RestController
@RequestMapping("/internal/api/manager/hash/crack")
@RequiredArgsConstructor
public class InternalWorkerApi {

    private final ManagerService managerService;

    @PatchMapping("/request")
    public ResponseEntity<Void> receiveWorkerResponse(@RequestBody WorkerResponse response) {
        managerService.processWorkerResponse(response);
        return ResponseEntity.ok().build();
    }
}
