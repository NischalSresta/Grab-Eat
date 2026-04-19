package com.nischal.backend.service.util;

import com.nischal.backend.dto.auth.UserResponse;
import com.nischal.backend.dto.user.PageResponse;
import com.nischal.backend.entity.User;
import com.nischal.backend.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;


@Component
@RequiredArgsConstructor
public class PaginationHelper {

    private final UserMapper userMapper;


    public PageResponse<UserResponse> buildUserPageResponse(Page<User> page) {
        List<UserResponse> content = page.getContent().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .empty(page.isEmpty())
                .build();
    }
}
