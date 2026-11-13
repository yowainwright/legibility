def can_publish(is_owner: bool, is_ready: bool) -> bool:
    if is_owner and is_ready:
        return True
    return False
