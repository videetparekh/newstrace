import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingState from '../components/LoadingState'

describe('LoadingState', () => {
  it('renders loading text', () => {
    render(<LoadingState />)
    expect(screen.getByText('Fetching latest news...')).toBeInTheDocument()
  })

  it('renders spinner element', () => {
    const { container } = render(<LoadingState />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })
})
