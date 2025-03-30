import styled, { keyframes } from 'styled-components';
import { layout } from '../../styles/GlobalStyles';

// Animaciones reutilizables
export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const shakeAnimation = keyframes`
  0%   { transform: translateX(0); }
  25%  { transform: translateX(-5px); }
  50%  { transform: translateX(5px); }
  75%  { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

// Enhanced Card component with improved mobile styling
export const Card = styled.div`
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
  padding: var(--space-lg);
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: ${props => props.$autoHeight ? 'auto' : '100%'};
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: ${props => props.$noHover ? 'none' : 'translateY(-3px)'};
    box-shadow: ${props => props.$noHover ? 'var(--card-shadow)' : 'var(--hover-shadow)'};
  }
  
  @media (max-width: ${layout.breakpoints.tablet}) {
    padding: var(--space-md);
  }

  @media (max-width: ${layout.breakpoints.mobile}) {
    padding: var(--space-md) var(--space-sm);
    border-radius: var(--radius-md);
  }
`;

// Mobile-optimized page container
export const PageContainer = styled.div`
  max-width: ${layout.containerWidth.xl};
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  
  @media (max-width: ${layout.breakpoints.tablet}) {
    padding: var(--space-md) var(--space-md);
    gap: var(--space-md);
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    padding: var(--space-sm) var(--mobile-padding);
    gap: var(--space-sm);
    padding-bottom: calc(var(--mobile-footer-height) + var(--space-sm));
  }
`;

// Section Header with consistent styling
export const SectionHeader = styled.div`
  margin-bottom: var(--space-lg);
  
  h2 {
    font-size: 1.8rem;
    position: relative;
    display: inline-block;
    margin-bottom: var(--space-md);
    
    &:after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 60px;
      height: 3px;
      background: var(--gradient);
      border-radius: 3px;
    }
  }
  
  p {
    font-size: 1rem;
    opacity: 0.8;
    max-width: 600px;
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    h2 {
      font-size: 1.5rem;
    }
    
    p {
      font-size: 0.9rem;
    }
  }
`;

// Enhanced Button with better mobile support - convert props to transient with $
export const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: ${props => props.$large ? 'var(--space-md) var(--space-lg)' : 'var(--space-sm) var(--space-md)'};
  font-size: ${props => props.$large ? '1rem' : '0.9rem'};
  font-weight: 500;
  border-radius: var(--radius-md);
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  background: ${props => {
    if (props.disabled) return 'var(--disabled-background)';
    if (props.$primary) return 'var(--gradient)';
    if (props.$danger) return 'var(--error-gradient)';
    return 'var(--background-alt-color)';
  }};
  color: ${props => {
    if (props.$primary || props.$danger) return 'white';
    return 'var(--text-color)';
  }};
  box-shadow: ${props => props.$primary ? 'var(--button-shadow)' : 'none'};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  opacity: ${props => props.disabled ? '0.7' : '1'};
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$primary) return 'var(--gradient-hover)';
      if (props.$danger) return 'var(--error-gradient-hover)';
      return 'var(--background-hover)';
    }};
    box-shadow: ${props => props.$primary ? 'var(--hover-shadow)' : 'none'};
    transform: translateY(-2px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    min-height: var(--mobile-touch-target);
    width: ${props => props.$fullWidth ? '100%' : 'auto'};
    font-size: 0.9rem;
    padding: ${props => props.$large ? '0.7rem 1.2rem' : '0.6rem 1rem'};
  }
`;

// Form Group with consistent styling
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-md);
  width: 100%;
`;

// Form Label with consistent styling
export const Label = styled.label`
  font-weight: 500;
  margin-bottom: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  
  svg {
    width: 16px;
    height: 16px;
    opacity: 0.7;
  }
`;

// Enhanced mobile-friendly input
export const Input = styled.input`
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--input-background);
  color: var(--input-text);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--hover-shadow);
  }
  
  &::placeholder {
    color: var(--text-color);
    opacity: 0.5;
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    min-height: var(--mobile-touch-target);
    font-size: 16px; /* Prevent iOS zoom */
    padding: 0.6rem var(--space-sm);
  }
`;

// Select with consistent styling
export const Select = styled.select`
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--input-background);
  color: var(--input-text);
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23777777' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--hover-shadow);
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    min-height: 44px;
  }
`;

// Textarea with consistent styling
export const TextArea = styled.textarea`
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--input-background);
  color: var(--input-text);
  transition: all 0.3s ease;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--hover-shadow);
  }
  
  &::placeholder {
    color: var(--text-color);
    opacity: 0.5;
  }
`;

// Badge/Tag component with consistent styling
export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  
  background: ${props => {
    if (props.primary) return 'var(--primary-color)';
    if (props.success) return 'var(--success-color)';
    if (props.error) return 'var(--error-color)';
    if (props.warning) return '#f0b429';
    return 'var(--background-alt-color)';
  }};
  
  color: ${props => {
    if (props.primary || props.success || props.error || props.warning) return 'white';
    return 'var(--text-color)';
  }};
`;

// Better mobile grid
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 'auto-fill'}, minmax(${props => props.minWidth || '280px'}, 1fr));
  gap: ${props => props.gap || 'var(--space-md)'};
  width: 100%;
  
  & > * {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  @media (max-width: ${layout.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fill, minmax(${props => props.tabletMinWidth || '240px'}, 1fr));
    gap: var(--space-sm);
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    grid-template-columns: ${props => props.mobileColumns || '1fr'};
    gap: var(--space-sm);
  }
`;

// Divider component
export const Divider = styled.hr`
  border: none;
  height: 1px;
  background-color: var(--border-color);
  margin: var(--space-md) 0;
`;

// Enhanced empty state
export const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-xl);
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
  
  svg {
    width: 60px;
    height: 60px;
    color: var(--border-color);
    margin-bottom: var(--space-md);
  }
  
  h3 {
    font-size: 1.3rem;
    margin-bottom: var(--space-md);
  }
  
  p {
    max-width: 400px;
    margin: 0 auto var(--space-lg);
    opacity: 0.8;
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    padding: var(--space-lg);
    border-radius: var(--radius-md);
    
    svg {
      width: 40px;
      height: 40px;
    }
    
    h3 {
      font-size: 1.1rem;
    }
    
    p {
      font-size: 0.9rem;
    }
  }
`;

// Better mobile flex container
export const Flex = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'center'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || 'var(--space-md)'};
  flex-wrap: ${props => props.wrap || 'nowrap'};
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  @media (max-width: ${layout.breakpoints.tablet}) {
    flex-direction: ${props => props.tabletDirection || props.direction || 'row'};
    flex-wrap: ${props => props.tabletWrap || 'wrap'};
    gap: ${props => props.tabletGap || props.gap || 'var(--space-sm)'};
  }
  
  @media (max-width: ${layout.breakpoints.mobile}) {
    flex-direction: ${props => props.mobileDirection || 'column'};
    align-items: ${props => props.mobileAlign || 'flex-start'};
    gap: ${props => props.mobileGap || 'var(--space-xs)'};
  }
`;

// Icon container with consistent styling
export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  
  svg {
    width: ${props => props.size || '24px'};
    height: ${props => props.size || '24px'};
    stroke-width: 2.2;
  }
`;

// Fix export default issue
const UIComponents = {
  Card,
  PageContainer,
  SectionHeader,
  Button,
  FormGroup,
  Label,
  Input,
  Select,
  TextArea,
  Badge,
  Grid,
  Divider,
  EmptyState,
  Flex,
  IconContainer
};

export default UIComponents;
