import { useContext } from 'react';
import AuthContexts from '../contexts/AuthContexts';

export default function useAuth() {
    useContext(AuthContexts);
}