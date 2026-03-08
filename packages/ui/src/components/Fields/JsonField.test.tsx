import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { JsonField } from './JsonField'

function TestJsonField(props: Omit<React.ComponentProps<typeof JsonField>, 'register'>) {
  const { register } = useForm()
  return <JsonField {...props} register={register} />
}

describe('JsonField', () => {
  it('renders textarea', () => {
    render(<TestJsonField name="metadata" label="Metadata" />)
    const textarea = document.getElementById('metadata')!
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('shows label', () => {
    render(<TestJsonField name="metadata" label="Metadata" />)
    expect(screen.getByLabelText('Metadata')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<TestJsonField name="metadata" label="Metadata" error="Invalid JSON format" />)
    expect(screen.getByText('Invalid JSON format')).toBeInTheDocument()
  })

  it('renders placeholder', () => {
    render(<TestJsonField name="metadata" label="Metadata" />)
    expect(screen.getByPlaceholderText('Enter valid JSON')).toBeInTheDocument()
  })
})
